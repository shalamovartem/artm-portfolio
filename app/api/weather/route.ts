export async function GET(){
 try{
  const response=await fetch('https://api.open-meteo.com/v1/forecast?latitude=47.422&longitude=40.093&current=temperature_2m,weather_code,is_day,wind_speed_10m&timezone=Europe%2FMoscow',{signal:AbortSignal.timeout(8000),next:{revalidate:900}});
  if(!response.ok)throw Error();const data=await response.json() as {current?:{temperature_2m:number;weather_code:number;is_day:number;wind_speed_10m:number;time:string}};
  if(!data.current||!Number.isFinite(data.current.temperature_2m))throw Error();return Response.json(data.current,{headers:{'Cache-Control':'public,max-age=900'}});
 }catch{return Response.json({error:'Погода временно недоступна'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
