window.CHAPTERS = [
  { id: "ep01", label: "EP01", status: "available", data: window.EP01_DATA },
  { id: "ep02", label: "EP02", status: "available", data: window.EP02_DATA },
  { id: "ep03", label: "EP03", status: "available", data: window.EP03_DATA },
  ...Array.from({ length: 19 }, (_, index) => {
    const number = String(index + 4).padStart(2, "0");
    return { id: `ep${number}`, label: `EP${number}`, status: "coming-soon", data: null };
  })
];
