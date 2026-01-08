export default (str?: string) => {
  if (!str) return str;

  const sentence = str.replace(/_/g, ' ').toLowerCase();
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
};
