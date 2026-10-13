import type { Metadata } from "next";
import "./globals.css";
const baseMetadata:Metadata={icons:{icon:"/media/ag-logo.png"},title:"Артём Шаламов — инженерия, электроника, жизнь",description:"Инженер-конструктор. Директор по операционной деятельности RoboGrade. Проекты, фотографии и контакты Артёма Шаламова."};
export async function generateMetadata():Promise<Metadata>{
 const {readState}=await import('../lib/storage');
 const doc=(await readState()).published;const favicon=doc.favicon;
 return {...baseMetadata,title:doc.browserTitle||doc.name,icons:{icon:favicon||'/media/ag-logo.png'}};
}
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>}
