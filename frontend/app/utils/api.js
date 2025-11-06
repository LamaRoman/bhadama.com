import { url } from "inspector";

export const api = async(url, method="GET",body=null)=>{
    const token = typeof window!=="undefined"? localStorage.getItem("token"):null;
}

const headers = {"Content-Type":"application/json"};
if(token) headers.Authorization = `Bearer ${token}`;

const res = await fetch(`http://localhost:5001${url}`,{
    method,
    headers,
    body:body?JSON.stringyfy(body):null,
});

return await res.json();