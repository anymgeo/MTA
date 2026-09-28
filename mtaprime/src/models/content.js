/**
 * @typedef {'ka'|'en'} Locale
 * @typedef {'winter'|'summer'} Season
 * @typedef {{image:string,heroImages:string[]}} SeasonMedia
 * @typedef {{name:string,type:string,hours:string}} Lift
 * @typedef {{about?:string,history?:string,facts?:string,arrivalText?:string,infrastructureText?:string,
 * logoUrl?:string,videoUrl?:string,videoWebmUrl?:string,posterUrl?:string,pdfUrl?:string,bannerImage?:string,purchaseUrl?:string,
 * markerX?:string,markerY?:string,travelTimes?:{city:string,time:string}[],
 * liftList?:{name:string,type:string,duration:string,hours:string}[],
 * trailList?:{name:string,length:string,difficulty:'easy'|'medium'|'difficult'}[],
 * activities?:{title:string,text:string,iconKey:string}[],
 * social?:{resortFacebook?:string,facebook?:string,instagram?:string,tiktok?:string}}} ResortPageContent
 * @typedef {{label:string,value:number,description:string}} TrailDifficulty
 * @typedef {{title:string,text:string,iconKey:string}} Experience
 * @typedef {{winterImage?:string,summerImage?:string,imageAlt?:string,note?:string,featured?:boolean,homepageVisible?:boolean,displayOrder?:number}} LiveCardSettings
 * @typedef {{resortId:string,status:'open'|'closed'|'limited'|'delayed'|'hold'|'maintenance'|'unavailable',temperature?:number|null,weatherCondition?:string|null,snowDepthCm?:number|null,newSnow24hCm?:number|null,liftsOpen?:number|null,liftsTotal?:number|null,trailsOpen?:number|null,trailsTotal?:number|null,windSpeedKmh?:number|null,windDirection?:string|null,visibility?:string|null,operatingFrom?:string|null,operatingTo?:string|null,topElevationM?:number|null,lastUpdatedAt?:string|null}} LiveResortConditions
 * @typedef {{id:number|string,slug:string,name:string,region:string,description:string,image:string,
 * summerImage:string,page?:ResortPageContent,liveCard?:LiveCardSettings,seasons?:{winter:SeasonMedia,summer:SeasonMedia},status:'OPEN'|'LIMITED'|'CLOSED',statusLabel?:string,lifts:string,trails:string,
 * temp:string,snow:string,newSnow:string,wind:string,hours:string,elevation:string,highestPoint:string,
 * pistes:string,winterSeason:string,heroImages:string[],gallery:string[],liftList:Lift[],
 * trailDifficulty:TrailDifficulty[],experience:{winter:Experience[],summer:Experience[]},
 * transport:{car:string,transfer:string,routeUrl:string}}} Resort
 * @typedef {{id:number|string,slug:string,title:string,date:string,image:string,excerpt:string,content:string[],gallery:string[]}} NewsArticle
 * @typedef {{id:number|string,slug:string,title:string,resort:string,resortId:string,year:number,category:string,image:string,date:string,
 * description:string,overview:string,activities:string[],highlights:string[],stats:{value:string,label:string}[]}} Project
 * @typedef {{id:number|string,title:string,description:string,image:string,seasons:Season[]}} Activity
 */
export {};
