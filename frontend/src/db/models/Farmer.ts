import { Model } from '@nozbe/watermelondb'
import { date, readonly, text } from '@nozbe/watermelondb/decorators'

export default class Farmer extends Model {
    static table = 'farmers'

    @text('name') name!: string
    @text('phone') phone!: string
    @text('location') location!: string
    @readonly @date('created_at') createdAt!: Date
    @readonly @date('updated_at') updatedAt!: Date
}
