import http from 'k6/http';
import { sleep } from 'k6';

// Minimal load test: 10 virtual users running for 30 seconds.
// Each VU calls the target endpoint and waits 1 second before the next iteration,
// simulating realistic think time between requests.
export const options = {
  vus: 10,        // number of virtual users
  duration: '30s' // total test duration
};

export default function () {
  http.get('https://test.k6.io');
  sleep(1); // think time — always include this to avoid unrealistic request rates
}
