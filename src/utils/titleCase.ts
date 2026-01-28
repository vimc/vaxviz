export default (str?: string) => str
  ?.replace(/_/g, ' ')
  ?.split(' ').map((word) => {
    return word.charAt(0).toUpperCase() + word?.toLowerCase().slice(1)
  }).join(' ');
