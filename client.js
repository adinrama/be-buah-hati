async function analyzeChild() {
  const response = await fetch('http://localhost:5000/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      gender: "Male",
      age: 7,
      weight: 25,
      height: 120,
      headCircumference: 54,
      weightAgeGender: "Obesitas",
      heightAgeGender: "Tinggi",
      headCircumferenceAgeGender: "Makrosefali",
      weightHeight: "Gizi Lebih"
    })
  });

  if (response.ok) {
    const data = await response.json();
    console.log("Summary API Response Text:", data.summaryText);
  } else {
    console.error(`Error ${response.status}: ${response.statusText}`);
  }
}

analyzeChild();
