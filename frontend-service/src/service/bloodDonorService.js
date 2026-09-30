import { BACKEND_API } from '../config';
import axios from 'axios';

export const register = (image, request) => {
    let formdata = new FormData();
    formdata.append("file", image);
    formdata.append("request", JSON.stringify(request));

    return axios.post(BACKEND_API + "/api/v1/donor", formdata, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}

export const search = (pincode, bloodGroup) => {
    const bg = encodeURIComponent(bloodGroup);
    return axios.get(BACKEND_API + "/api/v1/donors", {
        params: {
            "zip": pincode,
            "bloodGroup": bg
        }
    })
}

export const findAll = (status) => {
    return axios.get(BACKEND_API + "/api/v1/donors", {
        params: {
            "status": status
        }
    })
}

export const deleteDonor = (id) => {
    return axios.delete(`${BACKEND_API}/api/v1/donor/${id}`)
}

export const getDonor = (id)=>{
    return axios.get(`${BACKEND_API}/api/v1/donor/${id}`)
}

export const updateDonor = (id,status)=>{
    return axios.patch(`${BACKEND_API}/api/v1/donor/${id}`, {
        "status":status
    })
}