import { ADDRESS_API } from '../config';
import axios from 'axios';
export const addState = (countryId, state) => {
    return axios.post(`${ADDRESS_API}/api/v1/country/${countryId}/state`, state);
}

export const deleteState = (countryId, stateId) => {
    return axios.delete(`${ADDRESS_API}/api/v1/country/${countryId}/state/${stateId}`);
}

export const getAllStates = (countryId) => {
    return axios.get(`${ADDRESS_API}/api/v1/country/${countryId}/state`);
}