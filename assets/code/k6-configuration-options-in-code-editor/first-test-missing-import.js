import http from 'k6/http';
// ⚠ BROKEN ON PURPOSE: `sleep` is used below but never imported.
//   Run it to see the "sleep is not defined" error, then fix it with:
//     import { sleep } from 'k6';

export const options = {
  vus: 3,
  duration: '10s',
};

export default function () {
  http.get('https://quickpizza.grafana.com/');
  sleep(1);
}
