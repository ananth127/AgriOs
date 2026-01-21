import { Model } from '@nozbe/watermelondb'
import { date, readonly, text, field, relation } from '@nozbe/watermelondb/decorators'
import Farmer from './Farmer'

export default class Log extends Model {
    static table = 'logs'

    @text('content') content!: string
    @text('type') type!: string
    @field('is_synced') isSynced!: boolean

    @relation('farmers', 'farmer_id') farmer

    @readonly @date('created_at') createdAt!: Date
    @readonly @date('updated_at') updatedAt!: Date
}
