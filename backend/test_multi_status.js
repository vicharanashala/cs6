const run = async () => {
  const res = await fetch('http://localhost:5000/api/questions?status=pending,open,unresolved&sort=newest');
  const data = await res.json();
  console.log('Success:', data.success);
  console.log('Data length:', data.data?.length);
  if (data.data?.length > 0) {
    data.data.slice(0, 3).forEach(q => console.log('Status:', q.status, '| Title:', q.title));
  }
};
run();
