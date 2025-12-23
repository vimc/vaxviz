export default (str?: string) => str?.split(' ').map((word) => {
  return word.charAt(0).toUpperCase() + word?.toLowerCase().slice(1)
}).join(' ');
