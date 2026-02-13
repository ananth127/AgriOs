"""
LoRaWAN Gateway Service
Business logic for gateway management, ChirpStack/TTN integration, and device provisioning.
"""
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import base64
import json
import httpx
from .lorawan_models import LoRaGateway, LoRaNode, LoRaTelemetry, LoRaDownlink


class LoRaWANService:
    """Service for managing LoRaWAN infrastructure"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ============ Gateway Management ============
    
    def create_gateway(
        self,
        user_id: int,
        gateway_id: str,
        name: str,
        hardware_type: str = "RAK2287",
        frequency_plan: str = "IN865",
        latitude: float = None,
        longitude: float = None,
        network_server: str = "chirpstack",
        api_endpoint: str = None,
        farm_id: int = None,
    ) -> LoRaGateway:
        """Register a new LoRaWAN gateway"""
        gateway = LoRaGateway(
            user_id=user_id,
            farm_id=farm_id,
            gateway_id=gateway_id,
            name=name,
            hardware_type=hardware_type,
            frequency_plan=frequency_plan,
            latitude=latitude,
            longitude=longitude,
            network_server=network_server,
            api_endpoint=api_endpoint,
        )
        self.db.add(gateway)
        self.db.commit()
        self.db.refresh(gateway)
        return gateway
    
    def get_gateways(self, user_id: int) -> List[LoRaGateway]:
        """Get all gateways for a user"""
        return self.db.query(LoRaGateway).filter(
            LoRaGateway.user_id == user_id
        ).all()
    
    def get_gateway(self, gateway_id: int, user_id: int) -> Optional[LoRaGateway]:
        """Get a specific gateway"""
        return self.db.query(LoRaGateway).filter(
            LoRaGateway.id == gateway_id,
            LoRaGateway.user_id == user_id
        ).first()
    
    def update_gateway_status(
        self,
        gateway_id: str,
        is_online: bool,
        rx_packets: int = None,
        tx_packets: int = None,
    ):
        """Update gateway online status (called by webhook)"""
        gateway = self.db.query(LoRaGateway).filter(
            LoRaGateway.gateway_id == gateway_id
        ).first()
        
        if gateway:
            gateway.is_online = is_online
            gateway.last_seen = datetime.utcnow()
            if rx_packets:
                gateway.rx_packets_total += rx_packets
            if tx_packets:
                gateway.tx_packets_total += tx_packets
            self.db.commit()
    
    # ============ Node Management ============
    
    def create_node(
        self,
        user_id: int,
        dev_eui: str,
        name: str,
        node_type: str = "SENSOR",
        sensor_type: str = None,
        activation_mode: str = "OTAA",
        app_eui: str = None,
        app_key: str = None,
        gateway_id: int = None,
        latitude: float = None,
        longitude: float = None,
        zone: str = None,
    ) -> LoRaNode:
        """Register a new LoRaWAN sensor node"""
        node = LoRaNode(
            user_id=user_id,
            gateway_id=gateway_id,
            dev_eui=dev_eui.upper(),
            app_eui=app_eui.upper() if app_eui else None,
            name=name,
            node_type=node_type,
            sensor_type=sensor_type,
            activation_mode=activation_mode,
            app_key=app_key,  # Should be encrypted before storage
            latitude=latitude,
            longitude=longitude,
            zone=zone,
        )
        self.db.add(node)
        self.db.commit()
        self.db.refresh(node)
        return node
    
    def get_nodes(self, user_id: int, gateway_id: int = None) -> List[LoRaNode]:
        """Get all nodes for a user, optionally filtered by gateway"""
        query = self.db.query(LoRaNode).filter(LoRaNode.user_id == user_id)
        if gateway_id:
            query = query.filter(LoRaNode.gateway_id == gateway_id)
        return query.all()
    
    def get_node_by_eui(self, dev_eui: str) -> Optional[LoRaNode]:
        """Get a node by its Device EUI"""
        return self.db.query(LoRaNode).filter(
            LoRaNode.dev_eui == dev_eui.upper()
        ).first()
    
    # ============ Telemetry Handling ============
    
    def process_uplink(
        self,
        dev_eui: str,
        payload_raw: str,
        rssi: float = None,
        snr: float = None,
        spreading_factor: int = None,
        frame_count: int = None,
    ) -> Optional[LoRaTelemetry]:
        """Process an uplink message from a node (called by webhook)"""
        node = self.get_node_by_eui(dev_eui)
        if not node:
            print(f"⚠️ Unknown device: {dev_eui}")
            return None
        
        # Decode payload based on sensor type
        decoded = self.decode_payload(payload_raw, node.sensor_type)
        
        # Create telemetry log
        telemetry = LoRaTelemetry(
            node_id=node.id,
            frame_count=frame_count,
            rssi=rssi,
            snr=snr,
            spreading_factor=spreading_factor,
            payload_raw=payload_raw,
            payload_decoded=decoded,
            temperature=decoded.get("temperature"),
            humidity=decoded.get("humidity"),
            soil_moisture=decoded.get("soil_moisture"),
            battery_voltage=decoded.get("battery_voltage"),
        )
        self.db.add(telemetry)
        
        # Update node status
        node.is_online = True
        node.last_seen = datetime.utcnow()
        node.rssi = rssi
        node.snr = snr
        node.spreading_factor = spreading_factor
        node.last_telemetry = decoded
        if "battery" in decoded:
            node.battery_level = decoded["battery"]
        
        self.db.commit()
        self.db.refresh(telemetry)
        return telemetry
    
    def decode_payload(self, payload_b64: str, sensor_type: str = None) -> Dict[str, Any]:
        """Decode raw payload based on sensor type"""
        try:
            raw = base64.b64decode(payload_b64)
            
            # Generic decoder - customize based on your sensor hardware
            if sensor_type == "soil_moisture":
                return self._decode_soil_sensor(raw)
            elif sensor_type == "weather":
                return self._decode_weather_sensor(raw)
            elif sensor_type == "water_level":
                return self._decode_water_level(raw)
            else:
                # Generic decode - try to interpret as JSON or hex values
                try:
                    return json.loads(raw.decode('utf-8'))
                except:
                    return {"raw_hex": raw.hex()}
        except Exception as e:
            return {"error": str(e), "raw_b64": payload_b64}
    
    def _decode_soil_sensor(self, raw: bytes) -> Dict[str, Any]:
        """Decode soil moisture sensor payload (example: Dragino LSE01)"""
        if len(raw) >= 11:
            return {
                "battery_voltage": ((raw[0] << 8) | raw[1]) / 1000,
                "temperature": (((raw[2] << 8) | raw[3]) - 32768) / 10 if ((raw[2] << 8) | raw[3]) > 32767 else ((raw[2] << 8) | raw[3]) / 10,
                "soil_moisture": ((raw[4] << 8) | raw[5]) / 100,
                "soil_temperature": (((raw[6] << 8) | raw[7]) - 32768) / 10 if ((raw[6] << 8) | raw[7]) > 32767 else ((raw[6] << 8) | raw[7]) / 10,
                "soil_ec": ((raw[8] << 8) | raw[9]),  # Electrical conductivity
            }
        return {"raw_hex": raw.hex()}
    
    def _decode_weather_sensor(self, raw: bytes) -> Dict[str, Any]:
        """Decode weather station payload"""
        if len(raw) >= 8:
            return {
                "temperature": (((raw[0] << 8) | raw[1]) - 400) / 10,  # Celsius
                "humidity": raw[2],  # Percentage
                "pressure": ((raw[3] << 8) | raw[4]) / 10,  # hPa
                "wind_speed": raw[5] / 10,  # m/s
                "wind_direction": ((raw[6] << 8) | raw[7]),  # Degrees
            }
        return {"raw_hex": raw.hex()}
    
    def _decode_water_level(self, raw: bytes) -> Dict[str, Any]:
        """Decode water level sensor payload"""
        if len(raw) >= 4:
            return {
                "battery_voltage": ((raw[0] << 8) | raw[1]) / 1000,
                "water_level": ((raw[2] << 8) | raw[3]),  # mm or cm
            }
        return {"raw_hex": raw.hex()}
    
    # ============ Downlink Commands ============
    
    def send_downlink(
        self,
        node_id: int,
        payload: str,
        port: int = 1,
        confirmed: bool = False,
        user_id: int = None,
    ) -> LoRaDownlink:
        """Queue a downlink command to a node"""
        downlink = LoRaDownlink(
            node_id=node_id,
            user_id=user_id,
            payload=payload,
            port=port,
            confirmed=confirmed,
        )
        self.db.add(downlink)
        self.db.commit()
        self.db.refresh(downlink)
        
        # Try to send via network server API
        self._dispatch_downlink(downlink)
        
        return downlink
    
    def _dispatch_downlink(self, downlink: LoRaDownlink):
        """Send downlink to network server (ChirpStack/TTN)"""
        node = self.db.query(LoRaNode).get(downlink.node_id)
        if not node or not node.gateway_id:
            return
        
        gateway = self.db.query(LoRaGateway).get(node.gateway_id)
        if not gateway or not gateway.api_endpoint:
            return
        
        try:
            if gateway.network_server == "chirpstack":
                self._send_chirpstack_downlink(gateway, node, downlink)
            elif gateway.network_server == "ttn":
                self._send_ttn_downlink(gateway, node, downlink)
            
            downlink.status = "QUEUED"
            downlink.sent_at = datetime.utcnow()
            self.db.commit()
        except Exception as e:
            print(f"❌ Downlink dispatch failed: {e}")
            downlink.status = "FAILED"
            self.db.commit()
    
    def _send_chirpstack_downlink(self, gateway: LoRaGateway, node: LoRaNode, downlink: LoRaDownlink):
        """Send downlink via ChirpStack API"""
        url = f"{gateway.api_endpoint}/api/devices/{node.dev_eui}/queue"
        headers = {
            "Authorization": f"Bearer {gateway.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "deviceQueueItem": {
                "devEui": node.dev_eui,
                "confirmed": downlink.confirmed,
                "fPort": downlink.port,
                "data": downlink.payload,
            }
        }
        
        with httpx.Client() as client:
            response = client.post(url, json=payload, headers=headers)
            response.raise_for_status()
    
    def _send_ttn_downlink(self, gateway: LoRaGateway, node: LoRaNode, downlink: LoRaDownlink):
        """Send downlink via The Things Network API"""
        # TTN v3 API implementation
        pass  # TODO: Implement TTN integration
    
    # ============ Analytics ============
    
    def get_node_telemetry(
        self,
        node_id: int,
        hours: int = 24,
        limit: int = 100,
    ) -> List[LoRaTelemetry]:
        """Get recent telemetry for a node"""
        since = datetime.utcnow() - timedelta(hours=hours)
        return self.db.query(LoRaTelemetry).filter(
            LoRaTelemetry.node_id == node_id,
            LoRaTelemetry.received_at >= since,
        ).order_by(LoRaTelemetry.received_at.desc()).limit(limit).all()
    
    def get_network_health(self, user_id: int) -> Dict[str, Any]:
        """Get overall network health statistics"""
        gateways = self.get_gateways(user_id)
        nodes = self.get_nodes(user_id)
        
        online_gateways = sum(1 for g in gateways if g.is_online)
        online_nodes = sum(1 for n in nodes if n.is_online)
        
        # Calculate average signal quality
        avg_rssi = sum(n.rssi or 0 for n in nodes if n.rssi) / max(len([n for n in nodes if n.rssi]), 1)
        avg_snr = sum(n.snr or 0 for n in nodes if n.snr) / max(len([n for n in nodes if n.snr]), 1)
        
        return {
            "gateways_total": len(gateways),
            "gateways_online": online_gateways,
            "nodes_total": len(nodes),
            "nodes_online": online_nodes,
            "average_rssi": round(avg_rssi, 1),
            "average_snr": round(avg_snr, 1),
            "network_coverage": (online_nodes / len(nodes) * 100) if nodes else 0,
        }
