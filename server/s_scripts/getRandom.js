const { nanoid } = require("nanoid");

// the 46 presidents of the US
const presidents = [
  "George Washington",
  "John Adams",
  "Thomas Jefferson",
  "James Madison",
  "James Monroe",
  "John Quincy Adam",
  "Andrew Jackson",
  "Martin Van Buren",
  "William Henry Harrison",
  "John Tyler",
  "James Polk",
  "Zachary Taylor",
  "Millard Fillmore",
  "Franklin Pierce",
  "James Buchanan",
  "Abraham Lincoln",
  "Andrew Johnson",
  "Ulysses Grant",
  "Rutherford Hayes",
  "James Garfield",
  "Chester Arthur",
  "Grover Cleveland",
  "Benjamin Harrison",
  "Grover Cleveland",
  "William McKinley",
  "Theodore Roosevelt",
  "William Howard Taft",
  "Woodrow Wilson",
  "Warren Harding",
  "Calvin Coolidge",
  "Herbert Hoover",
  "Franklin Roosevelt",
  "Harry Truman",
  "Dwight Eisenhower",
  "John Kennedy",
  "Lyndon Johnson",
  "Richard Nixon",
  "Gerald Ford",
  "James Carter",
  "Ronald Reagan",
  "George Bush Senior",
  "William Clinton",
  "George Bush",
  "Barack Obama",
  "Donald Trump",
  "Joe Biden",
];

const randomRoomName = currentRoomNames => {
  let generatedRandomPresident =
    presidents[Math.floor(Math.random() * presidents.length)];
  // to reduce the collision chance even further, you can add nanoid: https://www.npmjs.com/package/nanoid
  let generatedRandomSmallCode = nanoid(5);
  let generatedRandomRoomName = (
    generatedRandomPresident +
    " " +
    generatedRandomSmallCode.toUpperCase()
  )
    .split(" ")
    .join("-");
  if (generatedRandomRoomName in currentRoomNames) {
    console.log("dupplicate! Trying to generate a new room name");
    return randomRoomName(currentRoomNames);
  } else {
    return generatedRandomRoomName;
  }
};

module.exports = { randomRoomName };
