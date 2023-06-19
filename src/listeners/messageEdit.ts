import { ApplyOptions } from '@sapphire/decorators';
import { envParseArray } from "@skyra/env-utilities";
import { Listener } from '@sapphire/framework';
import {
    GatewayDispatchEvents,
    type GatewayMessageUpdateDispatch,
    MessageFlagsBitField,
    type Snowflake
} from 'discord.js';

const CHANNELS = envParseArray('CHANNELS');

@ApplyOptions<Listener.Options>(({ container }) => ({
    description: 'Handle Raw Message Update events',
    emitter: container.client.ws,
    event: GatewayDispatchEvents.MessageUpdate
}))
export class MessageEdit extends Listener {
    /**
     * Listen to MessageUpdate events.
     * @param data
     */
    public override run(data: GatewayMessageUpdateDispatch['d']): void {
        if (!data.guild_id) return;

        const guild = this.container.client.guilds.cache.get(data.guild_id);
        if (!guild || !guild.channels.cache.has(data.channel_id)) return;

        // Only proceed if this channel is set in CHANNELS
        if (!this.doChannelCheck(data.channel_id)) return;

        // Hardcoded string until commands are written.
        if (!this.searchString(data.content as string)) return;

        // Do nothing if message does not come from another channel (follow).
        if (!new MessageFlagsBitField(data.flags).has('IsCrosspost')) return;

        try {
            // Passed all checks. Delete the message.
            this.container.client.on('messageUpdate', async message => {
                await message.delete()
            })
        } catch (e) {
            console.log('message.delete() error: ' + e)
        }
    }

    /**
     * Check if the channelId is in CHANNELS env.
     * @param channelId
     * @private
     */
    private doChannelCheck(channelId: Snowflake): boolean {
        return CHANNELS.includes(channelId);
    }

    /**
     * Search message content for string.
     * @param content
     * @private
     */
    private searchString(content: string): boolean {
        const regex = /Original Message Deleted/gi;
        return regex.test(content);
    }
}