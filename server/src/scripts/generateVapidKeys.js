// Prints a fresh VAPID key pair for Web Push. Run once and copy the output
// into your .env (locally) and the Render dashboard (production).
import webpush from 'web-push';

const { publicKey, privateKey } = webpush.generateVAPIDKeys();
console.log('\nAdd these to your environment variables:\n');
console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
console.log('VAPID_SUBJECT=mailto:you@example.com\n');
