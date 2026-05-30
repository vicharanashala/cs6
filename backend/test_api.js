const run = async () => {
  const res = await fetch('http://localhost:5000/api/questions?sort=mostUpvoted');
  const data = await res.json();
  console.log('Success:', data.success);
  console.log('Data length:', data.data?.length);
  if (data.data?.length > 0) {
    console.log('First question title:', data.data[0].title);
  }
};
run();
