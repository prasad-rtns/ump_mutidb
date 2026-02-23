export async function checkExternalApiHealth() {
  const start = Date.now();

  try {
    const res = await fetch('https://api.github.com');

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return {
      status: 'UP',
      latency: Date.now() - start
    };
  } catch (error: any) {
    return {
      status: 'DOWN',
      error: error.message
    };
  }
}