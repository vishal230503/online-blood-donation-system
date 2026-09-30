import { ADDRESS_API } from '../config';
import axios from 'axios';
export const addArea = (countryId, stateId, cityId, area) => {
    return axios.post(`${ADDRESS_API}/api/v1/country/${countryId}/state/${stateId}/city/${cityId}/area`, area);
}

export const deleteArea = (countryId, stateId, cityId, areaId) => {
    return axios.delete(`${ADDRESS_API}/api/v1/country/${countryId}/state/${stateId}/city/${cityId}/area/${areaId}`);
}

export const getAllAreas = (countryId, stateId, cityId) => {
    return axios.get(`${ADDRESS_API}/api/v1/country/${countryId}/state/${stateId}/city/${cityId}/area`);
}