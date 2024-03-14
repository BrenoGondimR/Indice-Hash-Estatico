import axios from "axios";
import {searchByKeyUrl, setItemsPerPageUrl} from "@/constants/config";


export const postConstruirIndice = (newItemsPerPage) => {
    return axios.post(setItemsPerPageUrl, { newItemsPerPage });
};

export const searchForKey = (key) => {
    return axios.get(`${searchByKeyUrl}${key}`);
};