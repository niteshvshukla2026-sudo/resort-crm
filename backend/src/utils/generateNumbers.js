exports.generateReqNo = () => {
  const d = new Date();
  return `REQ-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(100+Math.random()*900)}`;
};

exports.generatePoNo = () => {
  const d = new Date();
  return `PO-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(100+Math.random()*900)}`;
};

exports.generateGrnNo = () => {
  const d = new Date();
  return `GRN-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(100+Math.random()*900)}`;
};