import React from "react";

const Shell = (props) => {
  const {children} = props;
  return (<div className="ShellWrapper" style={{height: '100%', width: '100%'}}>{children}</div>);
}
export default Shell;
