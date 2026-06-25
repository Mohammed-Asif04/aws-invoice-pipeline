const n = "200600.00";
try {
  console.log(n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
} catch(e) {
  console.log(e.message);
}
