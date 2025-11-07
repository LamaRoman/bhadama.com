export async function api(url,options = {}){
    const token = typeof window !== "undefined"? localStorage.getItem("token"):null;
    console.log(token)

    const headers = {
        "Content-Type":"application/json",
        ...(options.headers || {}),
        ...(token && {Authorization:`Bearer ${token}`}),
    };

    const res = await fetch(`http://localhost:5001${url}`,{...options,headers});
    const data = await res.json();

    return data;

}