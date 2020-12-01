const validateName = name => {
  //in server.js

  // if (Validate.validateName(name) !== "error") {
  //     name = Validate.validateName(name);
  //     console.log(name + " passed");
  //   } else {
  //     name = Validate.validateName(name);
  //     console.log(name + " failed");
  //   }

  if (name) {
    // trim unwanted characters
    name = name.match(/[A-Z-a-z-0-9]/g);
    // join the array of remaining letters
    name = name.join("");
    console.log(`Sanitized name: ${name}fromValidate`);
  }
  if (name.length === 0 || name.length > 20) {
    return "error";
  } else {
    return name;
  }
};

module.exports = { validateName };
