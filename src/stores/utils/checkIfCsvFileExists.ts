export default (filename: string) => {
  const modules = import.meta.glob('/public/data/csv/*');
  const filePath = `/public/data/csv/${filename}`;
  if (!Object.keys(modules).includes(filePath)) {
    throw new Error(`The requested file "${filename}" does not exist on the server.`);
  }
};
