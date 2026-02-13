"""
LoRaWAN Gateway API Router
Endpoints for gateway/node management and telemetry.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user_id
from .lorawan_service import LoRaWANService
from .lorawan_models import LoRaGateway, LoRaNode


router = APIRouter(prefix="/lorawan", tags=["LoRaWAN"])


# ============ Schemas ============

class GatewayCreate(BaseModel):
    gateway_id: str
    name: str
    hardware_type: str = "RAK2287"
    frequency_plan: str = "IN865"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    network_server: str = "chirpstack"
    api_endpoint: Optional[str] = None
    api_key: Optional[str] = None
    farm_id: Optional[int] = None


class GatewayResponse(BaseModel):
    id: int
    gateway_id: str
    name: str
    hardware_type: str
    frequency_plan: str
    latitude: Optional[float]
    longitude: Optional[float]
    is_online: bool
    last_seen: Optional[str]
    rx_packets_total: int
    tx_packets_total: int
    
    class Config:
        from_attributes = True


class NodeCreate(BaseModel):
    dev_eui: str
    name: str
    node_type: str = "SENSOR"
    sensor_type: Optional[str] = None
    activation_mode: str = "OTAA"
    app_eui: Optional[str] = None
    app_key: Optional[str] = None
    gateway_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    zone: Optional[str] = None


class NodeResponse(BaseModel):
    id: int
    dev_eui: str
    name: str
    node_type: str
    sensor_type: Optional[str]
    is_online: bool
    battery_level: Optional[float]
    rssi: Optional[float]
    snr: Optional[float]
    last_seen: Optional[str]
    last_telemetry: dict
    zone: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    
    class Config:
        from_attributes = True


class TelemetryResponse(BaseModel):
    id: int
    node_id: int
    rssi: Optional[float]
    snr: Optional[float]
    payload_decoded: dict
    temperature: Optional[float]
    humidity: Optional[float]
    soil_moisture: Optional[float]
    received_at: str
    
    class Config:
        from_attributes = True


class DownlinkCreate(BaseModel):
    payload: str
    port: int = 1
    confirmed: bool = False


class UplinkWebhook(BaseModel):
    """ChirpStack uplink webhook payload (simplified)"""
    devEui: str
    data: Optional[str] = None  # Base64 encoded
    rxInfo: Optional[List[dict]] = None
    fCnt: Optional[int] = None


class NetworkHealthResponse(BaseModel):
    gateways_total: int
    gateways_online: int
    nodes_total: int
    nodes_online: int
    average_rssi: float
    average_snr: float
    network_coverage: float


# ============ Gateway Endpoints ============

@router.post("/gateways", response_model=GatewayResponse)
async def create_gateway(
    data: GatewayCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Register a new LoRaWAN gateway"""
    service = LoRaWANService(db)
    gateway = service.create_gateway(
        user_id=user_id,
        gateway_id=data.gateway_id,
        name=data.name,
        hardware_type=data.hardware_type,
        frequency_plan=data.frequency_plan,
        latitude=data.latitude,
        longitude=data.longitude,
        network_server=data.network_server,
        api_endpoint=data.api_endpoint,
        farm_id=data.farm_id,
    )
    return gateway


@router.get("/gateways", response_model=List[GatewayResponse])
async def get_gateways(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Get all gateways for the current user"""
    service = LoRaWANService(db)
    return service.get_gateways(user_id)


@router.get("/gateways/{gateway_id}", response_model=GatewayResponse)
async def get_gateway(
    gateway_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Get a specific gateway"""
    service = LoRaWANService(db)
    gateway = service.get_gateway(gateway_id, user_id)
    if not gateway:
        raise HTTPException(status_code=404, detail="Gateway not found")
    return gateway


# ============ Node Endpoints ============

@router.post("/nodes", response_model=NodeResponse)
async def create_node(
    data: NodeCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Register a new LoRaWAN sensor node"""
    service = LoRaWANService(db)
    node = service.create_node(
        user_id=user_id,
        dev_eui=data.dev_eui,
        name=data.name,
        node_type=data.node_type,
        sensor_type=data.sensor_type,
        activation_mode=data.activation_mode,
        app_eui=data.app_eui,
        app_key=data.app_key,
        gateway_id=data.gateway_id,
        latitude=data.latitude,
        longitude=data.longitude,
        zone=data.zone,
    )
    return node


@router.get("/nodes", response_model=List[NodeResponse])
async def get_nodes(
    gateway_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Get all nodes for the current user"""
    service = LoRaWANService(db)
    return service.get_nodes(user_id, gateway_id)


@router.get("/nodes/{node_id}/telemetry", response_model=List[TelemetryResponse])
async def get_node_telemetry(
    node_id: int,
    hours: int = 24,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Get recent telemetry for a node"""
    service = LoRaWANService(db)
    return service.get_node_telemetry(node_id, hours, limit)


@router.post("/nodes/{node_id}/downlink")
async def send_downlink(
    node_id: int,
    data: DownlinkCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Queue a downlink command to a node"""
    service = LoRaWANService(db)
    downlink = service.send_downlink(
        node_id=node_id,
        payload=data.payload,
        port=data.port,
        confirmed=data.confirmed,
        user_id=user_id,
    )
    return {"status": downlink.status, "id": downlink.id}


# ============ Webhook Endpoints ============

@router.post("/webhooks/uplink")
async def receive_uplink(
    data: UplinkWebhook,
    db: Session = Depends(get_db),
):
    """Receive uplink data from ChirpStack/TTN (webhook)"""
    service = LoRaWANService(db)
    
    # Extract signal info from rxInfo
    rssi = None
    snr = None
    if data.rxInfo and len(data.rxInfo) > 0:
        rssi = data.rxInfo[0].get("rssi")
        snr = data.rxInfo[0].get("snr")
    
    telemetry = service.process_uplink(
        dev_eui=data.devEui,
        payload_raw=data.data or "",
        rssi=rssi,
        snr=snr,
        frame_count=data.fCnt,
    )
    
    if telemetry:
        return {"status": "processed", "telemetry_id": telemetry.id}
    return {"status": "unknown_device"}


# ============ Analytics ============

@router.get("/health", response_model=NetworkHealthResponse)
async def get_network_health(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Get overall LoRaWAN network health statistics"""
    service = LoRaWANService(db)
    return service.get_network_health(user_id)
