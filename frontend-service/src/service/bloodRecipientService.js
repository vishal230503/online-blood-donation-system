import { BACKEND_API } from '../config';
import axios from 'axios';

export const register = (prescription, request) => {
    let formdata = new FormData();
    formdata.append("file", prescription);
    formdata.append("request", JSON.stringify(request));

    return axios.post(BACKEND_API + "/api/v1/recipient", formdata, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}

export const findAll = () => {
    return axios.get(BACKEND_API + "/api/v1/recipients");
}

export const deleteRecipient = (id) => {
    return axios.delete(`${BACKEND_API}/api/v1/recipient/${id}`)
}

export const getRecipient = (id) => {
    return axios.get(`${BACKEND_API}/api/v1/recipient/${id}`)
}

export const updateRecipient = (id, status, comment) => {
    return axios.patch(`${BACKEND_API}/api/v1/recipient/${id}`, {
        "status": status,
        "comment": comment
    })
}