export function getLength(code) {
  return (code.length+1)/5;
}

export function getFrequency(code) {
  return Math.floor(1000000/(parseInt(code.substring(5, 9), 16) * 0.241246));
}

export function getFirstBurst(code) {
  return parseInt(code.substring(10, 14), 16);
}

export function getSecondBurst(code) {
  return parseInt(code.substring(15, 19), 16);
}

export function removePreamble(code) {
  return code.substring(20);
}

// let rng = Math.floor(Math.random() * 23);
// console.log(code.raw[rng]);
// console.log('\nlen=' + getLength(code.raw[rng]));
// console.log('\nfreq=' + getFrequency(code.raw[rng]));
// console.log('\nfirst=' + getFirstBurst(code.raw[rng]));
// console.log('\nsecond=' + getSecondBurst(code.raw[rng]));
// let newcode = removePreamble(code.raw[rng]);
// console.log('\nnewCode=' + newcode);

export function parse2hex(code, length) {
  let arr = [];
  
  for (let i = 0; i < length; i++) {
    if (i === 0) {
      arr.push(parseInt(code.substring(i*4,(i+1)*4), 16));
    } else {
      arr.push(parseInt(code.substring(i*4+i,(i+1)*4+1+i), 16));
    }
  }

  return arr;
}

// console.log('arr=');
// console.log(parse2hex(newcode, getLength(newcode)));

export function checkBurst(sent, received) {
  let i = 0;
  let notEqual = false;
  let min = 0;
  let max = 0;
  received.forEach(el => {
    min = sent[i] - 0.1*sent[i];
    max = sent[i] + 0.1*sent[i];

    if (el < min || el > max) {
      console.log("el: " + el);
      notEqual = true;
    }
    console.log("sent[i]: " + sent[i]);
    i++;
  });

  return notEqual;
}

export function checkFrequency(fSent, fReceived) {
  let min = fSent - fSent*0.1;
  let max = fSent + fSent*0.1;

  return fReceived < min || fReceived > max ? true : false;
}
