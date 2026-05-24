import "@testing-library/jest-dom";

// Limpia localStorage entre tests para evitar contaminación del persist middleware
beforeEach(() => {
  localStorage.clear();
});
