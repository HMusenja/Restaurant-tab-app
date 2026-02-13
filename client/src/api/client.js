// src/api/client.js
import axios from "axios";



// NO interceptors for now — keep it clean

export const get = (path, config = {}) =>
 axios.get(path, config).then(res => res.data);

export const post = (path, body) =>
 axios.post(path, body).then(res => res.data);

export const patch = (path, body) =>
 axios.patch(path, body).then(res => res.data);

export const del = (path) =>
 axios.delete(path).then(res => res.data);
