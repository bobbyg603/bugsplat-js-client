import { EventStreamActionType } from "../event-stream/event-stream-event";
import { Event } from './event';

export function createEventFromApiResponse(event: any, type: EventStreamActionType): Event {
    return {
        id: parseInt(event.id),
        action: type,
        createdDate: new Date(event.timestamp),
        subject: {
            initials: getInitialsOrDefault(event),
            email: event.username,
        },
        message: event.message,
    };
}

function getInitialsOrDefault(event: any): string {
    if (event.firstName && event.lastName) {
        const firstInitial = event.firstName[0];
        const lastInitial = event.lastName[0];
        return `${firstInitial}${lastInitial}`;
    }

    return event.username?.substring(0, 2) ?? '';
}