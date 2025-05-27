import { configureAbly } from '@ably-labs/react-hooks';

configureAbly({
    key: process.env.NEXT_PUBLIC_ABLY_API_KEY!,
    clientId: 'research-client',
});
