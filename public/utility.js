export function getFormData(form) {
    const fData = new FormData(form);
    const fromEntries1 = Array.from(fData);
    const formObject = Object.fromEntries(fromEntries1);
    return formObject;
}
