import {owner} from '../../lib/applications/server';
import Desk from './Desk';
import './desk.css';
export const dynamic='force-dynamic';
export const metadata={title:'Application Desk',description:'Private application workspace',robots:{index:false,follow:false,noarchive:true}};
export default async function Page(){return <Desk authenticated={await owner()}/>;}
