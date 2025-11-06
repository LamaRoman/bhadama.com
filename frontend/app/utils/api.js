export async function api(url,options = {}){
    const token = typeof window !== "undefined"? localStorage.getItem("token"):null;

    const headers = {
        "Content=Type":"application/json",
        ...api(options.headers || {}),
        ...api(token && {Authorization:`Bearer ${token}`}),
    };

    const res = await fetch(`http://localhost:5001${url}`,{...options,headers});
    const data = await res.json();

    return data;

}