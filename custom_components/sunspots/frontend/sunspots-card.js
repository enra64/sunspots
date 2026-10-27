var z=globalThis,L=z.ShadowRoot&&(z.ShadyCSS===void 0||z.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,V=Symbol(),be=new WeakMap,R=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==V)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(L&&e===void 0){let i=t!==void 0&&t.length===1;i&&(e=be.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&be.set(t,e))}return e}toString(){return this.cssText}},we=n=>new R(typeof n=="string"?n:n+"",void 0,V),q=(n,...e)=>{let t=n.length===1?n[0]:e.reduce((i,r,s)=>i+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+n[s+1],n[0]);return new R(t,n,V)},$e=(n,e)=>{if(L)n.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let i=document.createElement("style"),r=z.litNonce;r!==void 0&&i.setAttribute("nonce",r),i.textContent=t.cssText,n.appendChild(i)}},Y=L?n=>n:n=>n instanceof CSSStyleSheet?(e=>{let t="";for(let i of e.cssRules)t+=i.cssText;return we(t)})(n):n;var{is:ot,defineProperty:at,getOwnPropertyDescriptor:dt,getOwnPropertyNames:ut,getOwnPropertySymbols:lt,getPrototypeOf:ct}=Object,I=globalThis,Se=I.trustedTypes,pt=Se?Se.emptyScript:"",mt=I.reactiveElementPolyfillSupport,N=(n,e)=>n,G={toAttribute(n,e){switch(e){case Boolean:n=n?pt:null;break;case Object:case Array:n=n==null?n:JSON.stringify(n)}return n},fromAttribute(n,e){let t=n;switch(e){case Boolean:t=n!==null;break;case Number:t=n===null?null:Number(n);break;case Object:case Array:try{t=JSON.parse(n)}catch{t=null}}return t}},Ae=(n,e)=>!ot(n,e),xe={attribute:!0,type:String,converter:G,reflect:!1,useDefault:!1,hasChanged:Ae};Symbol.metadata??=Symbol("metadata"),I.litPropertyMetadata??=new WeakMap;var _=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=xe){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let i=Symbol(),r=this.getPropertyDescriptor(e,i,t);r!==void 0&&at(this.prototype,e,r)}}static getPropertyDescriptor(e,t,i){let{get:r,set:s}=dt(this.prototype,e)??{get(){return this[t]},set(o){this[t]=o}};return{get:r,set(o){let d=r?.call(this);s?.call(this,o),this.requestUpdate(e,d,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??xe}static _$Ei(){if(this.hasOwnProperty(N("elementProperties")))return;let e=ct(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(N("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(N("properties"))){let t=this.properties,i=[...ut(t),...lt(t)];for(let r of i)this.createProperty(r,t[r])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[i,r]of t)this.elementProperties.set(i,r)}this._$Eh=new Map;for(let[t,i]of this.elementProperties){let r=this._$Eu(t,i);r!==void 0&&this._$Eh.set(r,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let i=new Set(e.flat(1/0).reverse());for(let r of i)t.unshift(Y(r))}else e!==void 0&&t.push(Y(e));return t}static _$Eu(e,t){let i=t.attribute;return i===!1?void 0:typeof i=="string"?i:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return $e(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){let i=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,i);if(r!==void 0&&i.reflect===!0){let s=(i.converter?.toAttribute!==void 0?i.converter:G).toAttribute(t,i.type);this._$Em=e,s==null?this.removeAttribute(r):this.setAttribute(r,s),this._$Em=null}}_$AK(e,t){let i=this.constructor,r=i._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let s=i.getPropertyOptions(r),o=typeof s.converter=="function"?{fromAttribute:s.converter}:s.converter?.fromAttribute!==void 0?s.converter:G;this._$Em=r;let d=o.fromAttribute(t,s.type);this[r]=d??this._$Ej?.get(r)??d,this._$Em=null}}requestUpdate(e,t,i,r=!1,s){if(e!==void 0){let o=this.constructor;if(r===!1&&(s=this[e]),i??=o.getPropertyOptions(e),!((i.hasChanged??Ae)(s,t)||i.useDefault&&i.reflect&&s===this._$Ej?.get(e)&&!this.hasAttribute(o._$Eu(e,i))))return;this.C(e,t,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:r,wrapped:s},o){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,o??t??this[e]),s!==!0||o!==void 0)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),r===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[r,s]of this._$Ep)this[r]=s;this._$Ep=void 0}let i=this.constructor.elementProperties;if(i.size>0)for(let[r,s]of i){let{wrapped:o}=s,d=this[r];o!==!0||this._$AL.has(r)||d===void 0||this.C(r,void 0,s,d)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(i=>i.hostUpdate?.()),this.update(t)):this._$EM()}catch(i){throw e=!1,this._$EM(),i}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};_.elementStyles=[],_.shadowRootOptions={mode:"open"},_[N("elementProperties")]=new Map,_[N("finalized")]=new Map,mt?.({ReactiveElement:_}),(I.reactiveElementVersions??=[]).push("2.1.2");var ne=globalThis,Ee=n=>n,F=ne.trustedTypes,ke=F?F.createPolicy("lit-html",{createHTML:n=>n}):void 0,He="$lit$",v=`lit$${Math.random().toFixed(9).slice(2)}$`,Pe="?"+v,ht=`<${Pe}>`,x=document,P=()=>x.createComment(""),U=n=>n===null||typeof n!="object"&&typeof n!="function",ie=Array.isArray,ft=n=>ie(n)||typeof n?.[Symbol.iterator]=="function",J=`[ 	
\f\r]`,H=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ce=/-->/g,Me=/>/g,$=RegExp(`>|${J}(?:([^\\s"'>=/]+)(${J}*=${J}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Te=/'/g,Re=/"/g,Ue=/^(?:script|style|textarea|title)$/i,re=n=>(e,...t)=>({_$litType$:n,strings:e,values:t}),h=re(1),Vt=re(2),qt=re(3),A=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),Ne=new WeakMap,S=x.createTreeWalker(x,129);function Oe(n,e){if(!ie(n)||!n.hasOwnProperty("raw"))throw Error("invalid template strings array");return ke!==void 0?ke.createHTML(e):e}var gt=(n,e)=>{let t=n.length-1,i=[],r,s=e===2?"<svg>":e===3?"<math>":"",o=H;for(let d=0;d<t;d++){let a=n[d],u,c,l=-1,m=0;for(;m<a.length&&(o.lastIndex=m,c=o.exec(a),c!==null);)m=o.lastIndex,o===H?c[1]==="!--"?o=Ce:c[1]!==void 0?o=Me:c[2]!==void 0?(Ue.test(c[2])&&(r=RegExp("</"+c[2],"g")),o=$):c[3]!==void 0&&(o=$):o===$?c[0]===">"?(o=r??H,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,u=c[1],o=c[3]===void 0?$:c[3]==='"'?Re:Te):o===Re||o===Te?o=$:o===Ce||o===Me?o=H:(o=$,r=void 0);let f=o===$&&n[d+1].startsWith("/>")?" ":"";s+=o===H?a+ht:l>=0?(i.push(u),a.slice(0,l)+He+a.slice(l)+v+f):a+v+(l===-2?d:f)}return[Oe(n,s+(n[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),i]},O=class n{constructor({strings:e,_$litType$:t},i){let r;this.parts=[];let s=0,o=0,d=e.length-1,a=this.parts,[u,c]=gt(e,t);if(this.el=n.createElement(u,i),S.currentNode=this.el.content,t===2||t===3){let l=this.el.content.firstChild;l.replaceWith(...l.childNodes)}for(;(r=S.nextNode())!==null&&a.length<d;){if(r.nodeType===1){if(r.hasAttributes())for(let l of r.getAttributeNames())if(l.endsWith(He)){let m=c[o++],f=r.getAttribute(l).split(v),w=/([.?@])?(.*)/.exec(m);a.push({type:1,index:s,name:w[2],strings:f,ctor:w[1]==="."?Z:w[1]==="?"?Q:w[1]==="@"?ee:C}),r.removeAttribute(l)}else l.startsWith(v)&&(a.push({type:6,index:s}),r.removeAttribute(l));if(Ue.test(r.tagName)){let l=r.textContent.split(v),m=l.length-1;if(m>0){r.textContent=F?F.emptyScript:"";for(let f=0;f<m;f++)r.append(l[f],P()),S.nextNode(),a.push({type:2,index:++s});r.append(l[m],P())}}}else if(r.nodeType===8)if(r.data===Pe)a.push({type:2,index:s});else{let l=-1;for(;(l=r.data.indexOf(v,l+1))!==-1;)a.push({type:7,index:s}),l+=v.length-1}s++}}static createElement(e,t){let i=x.createElement("template");return i.innerHTML=e,i}};function k(n,e,t=n,i){if(e===A)return e;let r=i!==void 0?t._$Co?.[i]:t._$Cl,s=U(e)?void 0:e._$litDirective$;return r?.constructor!==s&&(r?._$AO?.(!1),s===void 0?r=void 0:(r=new s(n),r._$AT(n,t,i)),i!==void 0?(t._$Co??=[])[i]=r:t._$Cl=r),r!==void 0&&(e=k(n,r._$AS(n,e.values),r,i)),e}var X=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:i}=this._$AD,r=(e?.creationScope??x).importNode(t,!0);S.currentNode=r;let s=S.nextNode(),o=0,d=0,a=i[0];for(;a!==void 0;){if(o===a.index){let u;a.type===2?u=new D(s,s.nextSibling,this,e):a.type===1?u=new a.ctor(s,a.name,a.strings,this,e):a.type===6&&(u=new te(s,this,e)),this._$AV.push(u),a=i[++d]}o!==a?.index&&(s=S.nextNode(),o++)}return S.currentNode=x,r}p(e){let t=0;for(let i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}},D=class n{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,r){this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=k(this,e,t),U(e)?e===p||e==null||e===""?(this._$AH!==p&&this._$AR(),this._$AH=p):e!==this._$AH&&e!==A&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):ft(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==p&&U(this._$AH)?this._$AA.nextSibling.data=e:this.T(x.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:i}=e,r=typeof i=="number"?this._$AC(e):(i.el===void 0&&(i.el=O.createElement(Oe(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===r)this._$AH.p(t);else{let s=new X(r,this),o=s.u(this.options);s.p(t),this.T(o),this._$AH=s}}_$AC(e){let t=Ne.get(e.strings);return t===void 0&&Ne.set(e.strings,t=new O(e)),t}k(e){ie(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,i,r=0;for(let s of e)r===t.length?t.push(i=new n(this.O(P()),this.O(P()),this,this.options)):i=t[r],i._$AI(s),r++;r<t.length&&(this._$AR(i&&i._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let i=Ee(e).nextSibling;Ee(e).remove(),e=i}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},C=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,r,s){this.type=1,this._$AH=p,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=s,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=p}_$AI(e,t=this,i,r){let s=this.strings,o=!1;if(s===void 0)e=k(this,e,t,0),o=!U(e)||e!==this._$AH&&e!==A,o&&(this._$AH=e);else{let d=e,a,u;for(e=s[0],a=0;a<s.length-1;a++)u=k(this,d[i+a],t,a),u===A&&(u=this._$AH[a]),o||=!U(u)||u!==this._$AH[a],u===p?e=p:e!==p&&(e+=(u??"")+s[a+1]),this._$AH[a]=u}o&&!r&&this.j(e)}j(e){e===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},Z=class extends C{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===p?void 0:e}},Q=class extends C{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==p)}},ee=class extends C{constructor(e,t,i,r,s){super(e,t,i,r,s),this.type=5}_$AI(e,t=this){if((e=k(this,e,t,0)??p)===A)return;let i=this._$AH,r=e===p&&i!==p||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,s=e!==p&&(i===p||r);r&&this.element.removeEventListener(this.name,this,i),s&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},te=class{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){k(this,e)}};var yt=ne.litHtmlPolyfillSupport;yt?.(O,D),(ne.litHtmlVersions??=[]).push("3.3.3");var De=(n,e,t)=>{let i=t?.renderBefore??e,r=i._$litPart$;if(r===void 0){let s=t?.renderBefore??null;i._$litPart$=r=new D(e.insertBefore(P(),s),s,void 0,t??{})}return r._$AI(n),r};var se=globalThis,b=class extends _{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=De(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return A}};b._$litElement$=!0,b.finalized=!0,se.litElementHydrateSupport?.({LitElement:b});var _t=se.litElementPolyfillSupport;_t?.({LitElement:b});(se.litElementVersions??=[]).push("4.2.2");function ze(n,e){let t;return{call(...i){t!==void 0&&clearTimeout(t),t=setTimeout(()=>{t=void 0,n(...i)},e)},cancel(){t!==void 0&&clearTimeout(t),t=void 0}}}var oe=class{constructor(){this.latest=0}next(){return this.latest+=1,this.latest}isCurrent(e){return e===this.latest}},j=class{constructor(e,t){this.task=e;this.onSettled=t;this.guard=new oe;this.busy=!1;this.disposed=!1}request(e){this.disposed||(this.pending={arg:e,id:this.guard.next()},this.busy||this.drain())}dispose(){this.disposed=!0,this.pending=void 0}async drain(){for(this.busy=!0;this.pending&&!this.disposed;){let{arg:e,id:t}=this.pending;this.pending=void 0;let i;try{i={ok:!0,value:await this.task(e)}}catch(r){i={ok:!1,error:r}}!this.disposed&&this.guard.isCurrent(t)&&this.onSettled(i)}this.busy=!1}};var Le=["overview","timeline","map"],vt=/^binary_sensor\.[a-z0-9_]+$/,bt={overview:[6,22],timeline:[6,22],map:[4,23]};function wt(n){return typeof n=="object"&&n!==null&&!Array.isArray(n)}function Ie(n,e,t){if(n===void 0)return t;if(typeof n!="number"||!Number.isInteger(n)||n<0||n>24)throw new Error(`Invalid configuration: "${e}" must be an integer between 0 and 24`);return n}function Fe(n){if(typeof n!="string"||!vt.test(n))throw new Error(`Invalid configuration: "${String(n)}" is not a binary_sensor entity id (use the spot's "..._sunny" entity)`);return n}function je(n){if(!wt(n))throw new Error("Invalid configuration: expected an object");let e=(()=>{if(n.mode===void 0)return"overview";let l=Le.find(m=>m===n.mode);if(!l)throw new Error(`Invalid configuration: "mode" must be one of ${Le.join(", ")}`);return l})(),{entities:t,entity:i}=n;if(t!==void 0&&i!==void 0)throw new Error('Invalid configuration: use either "entity" or "entities", not both');let r;if(t!==void 0){if(!Array.isArray(t))throw new Error('Invalid configuration: "entities" must be a list of entity ids');r=t.map(Fe)}else i!==void 0?r=[Fe(i)]:r=[];if(r.length===0)throw new Error('Invalid configuration: "entity" or "entities" is required');let s=n.title;if(s!==void 0&&typeof s!="string")throw new Error('Invalid configuration: "title" must be a string');let[o,d]=bt[e],a=Ie(n.start_hour,"start_hour",o),u=Ie(n.end_hour,"end_hour",d);if(a>=u)throw new Error('Invalid configuration: "start_hour" must be smaller than "end_hour"');return{type:typeof n.type=="string"?n.type:"custom:sunspots-card",mode:e,entities:r,...s!==void 0?{title:s}:{},startHour:a,endHour:u}}var $t=["sunny","sunny_weather_aware","next_change","sun_remaining","sun_hours_today","sun_forecast"];function St(n){return $t.some(e=>e===n)}function Be(n,e){let t=n.entities[e];if(!t?.device_id)return;let i={};for(let[r,s]of Object.entries(n.entities))!s||s.device_id!==t.device_id||s.platform!==t.platform||St(s.translation_key)&&i[s.translation_key]===void 0&&(i[s.translation_key]=r);return i.sunny=e,i}function Ke(n,e){return(e.length>0?e:Object.keys(n.entities)).find(i=>{let r=n.entities[i];return i.startsWith("binary_sensor.")&&r?.platform==="sunspots"&&r.translation_key==="sunny"})}function ae(n){return!n||n.state==="unavailable"||n.state==="unknown"}function de(n,e){let t=n?.attributes[e];return typeof t=="string"&&t!==""?t:void 0}function We(n,e){let t=n?.attributes[e];return typeof t=="number"&&Number.isFinite(t)?t:void 0}var xt={sunny:"Sunny",shaded:"Shaded",sunny_cloudy:"Sun, but cloudy",unavailable:"Unavailable",until:"until {time}",from:"from {time}",tomorrow:"tomorrow",sun_expected_from:"sun expected from {time}",partly_expected_from:"partly sunny from {time}",no_sun_today:"no sun today",sun_hours_today:"{hours} h of sun today",cloud_coverage:"{percent}% clouds",legend_sunny:"Sunny",legend_partly:"Partly sunny",legend_unlikely:"Sun unlikely",legend_geometry:"Sun (no weather forecast)",now:"Now",timeline_alt:"{name}: {summary}",timeline_none:"no sun in this period",map_time:"Shown for {time}",map_alt:"Shadow map of {name} at {time}",map_loading:"Loading map…",map_error:"The map could not be loaded: {message}",map_too_large:"The map is too large to display.",map_invalid:"The map response was invalid.",map_sun_below:"The sun is below the horizon.",azimuth:"Azimuth",elevation:"Elevation",entity_missing:"Entity not found: {entity}",default_title:"Sunspots",card_name:"Sunspots",card_description:"Sun and shade status, timeline and shadow map for your spots"},At={sunny:"Sonnig",shaded:"Schatten",sunny_cloudy:"Sonne, aber bewölkt",unavailable:"Nicht verfügbar",until:"bis {time}",from:"ab {time}",tomorrow:"morgen",sun_expected_from:"Sonne erwartet ab {time}",partly_expected_from:"teils sonnig ab {time}",no_sun_today:"heute keine Sonne",sun_hours_today:"{hours} Std. Sonne heute",cloud_coverage:"{percent} % Wolken",legend_sunny:"Sonnig",legend_partly:"Teils sonnig",legend_unlikely:"Sonne unwahrscheinlich",legend_geometry:"Sonne (ohne Wettervorhersage)",now:"Jetzt",timeline_alt:"{name}: {summary}",timeline_none:"keine Sonne in diesem Zeitraum",map_time:"Dargestellt für {time}",map_alt:"Schattenkarte von {name} um {time}",map_loading:"Karte wird geladen …",map_error:"Die Karte konnte nicht geladen werden: {message}",map_too_large:"Die Karte ist zu groß für die Anzeige.",map_invalid:"Die Antwort für die Karte war ungültig.",map_sun_below:"Die Sonne steht unter dem Horizont.",azimuth:"Azimut",elevation:"Höhe",entity_missing:"Entität nicht gefunden: {entity}",default_title:"Sunspots",card_name:"Sunspots",card_description:"Sonnen- und Schattenstatus, Zeitleiste und Schattenkarte für deine Orte"},Et={en:xt,de:At};function kt(n){return(n??"en").toLowerCase().split(/[-_]/)[0]||"en"}function y(n,e,t={},i=Et){return(i[kt(n)]?.[e]??i.en?.[e]??e).replace(/\{(\w+)\}/g,(s,o)=>{let d=t[o];return d===void 0?s:String(d)})}var Ve=new Map;function E(n,e){let t=e??"en",i=Ve.get(t);if(!i){try{i=new Intl.DateTimeFormat(t,{hour:"2-digit",minute:"2-digit",timeZone:"UTC"})}catch{i=new Intl.DateTimeFormat("en",{hour:"2-digit",minute:"2-digit",timeZone:"UTC"})}Ve.set(t,i)}let r=(Math.round(n)%1440+1440)%1440;return i.format(new Date(r*6e4))}function ue(n,e){let t=E(n,e);return n>=1440?`${y(e,"tomorrow")} ${t}`:t}function le(n,e,t){return y(t,n,{time:ue(e,t)})}function ce(n,e){return`${new Intl.NumberFormat(e??"en",{maximumFractionDigits:1}).format(n)}°`}function Ct(n,e=307200){return typeof n!="string"||n.length===0?{ok:!1,reason:"invalid"}:n.length>e?{ok:!1,reason:"too_large"}:n.length*3>e&&new TextEncoder().encode(n).length>e?{ok:!1,reason:"too_large"}:{ok:!0,svg:n}}function qe(n){return typeof n=="number"&&Number.isFinite(n)?n:void 0}function Ye(n,e){let i=n?.response?.[e];if(typeof i!="object"||i===null)return{ok:!1,reason:"invalid"};let r=i,s=Ct(r.svg);return s.ok?{ok:!0,map:{svg:s.svg,time:typeof r.time=="string"?r.time:void 0,sunAzimuth:qe(r.sun_azimuth),sunElevation:qe(r.sun_elevation),sunBelowHorizon:r.sun_below_horizon===!0}}:s}function Ge(n,e){return{type:"call_service",domain:"sunspots",service:"render_shadow_map",service_data:{time:e},target:{entity_id:n},return_response:!0}}function Je(n){if(typeof n=="string")return n;if(typeof n=="object"&&n!==null&&"message"in n){let e=n.message;if(typeof e=="string"&&e!=="")return e}return"unknown error"}var Xe=new Map;function Mt(n){let e=Xe.get(n);return e||(e=new Intl.DateTimeFormat("en-US",{timeZone:n,hourCycle:"h23",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric"}),Xe.set(n,e)),e}function pe(n,e){let t={};for(let i of Mt(e).formatToParts(n))i.type!=="literal"&&(t[i.type]=Number(i.value));return Date.UTC(t.year??1970,(t.month??1)-1,t.day??1,(t.hour??0)%24,t.minute??0,t.second??0)}function me(n,e){return Math.floor(pe(n,e)/864e5)*864e5}var Tt=/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;function B(n,e,t){if(typeof n!="string")return;let i=Tt.exec(n.trim());if(!i)return;let r;if(i[7]===void 0)r=Date.UTC(Number(i[1]),Number(i[2])-1,Number(i[3]),Number(i[4]),Number(i[5]),Number(i[6]??0));else{let s=new Date(n.trim());if(Number.isNaN(s.getTime()))return;r=pe(s,e)}if(!Number.isNaN(r))return(r-t)/6e4}function Ze(n,e){return new Date(e+Math.round(n)*6e4).toISOString().slice(0,19)}function Qe(n,e){return(pe(n,e)-me(n,e))/6e4}function et(n,e,t){let i=n.map(([s,o])=>[Math.max(s,e),Math.min(o,t)]).filter(([s,o])=>o>s).sort((s,o)=>s[0]-o[0]),r=[];for(let[s,o]of i){let d=r[r.length-1];d&&s<=d[1]?d[1]=Math.max(d[1],o):r.push([s,o])}return r}function Rt(n,e,t){return(n-e)/(t-e)*100}function tt(n){let{windowStart:e,windowEnd:t,now:i}=n,r=et(n.geometry,e,t).map(([d,a])=>({start:d,end:a,kind:"sunny",past:a<=i})),s=[];for(let d of["unlikely","partly","sunny"]){let a=n.forecast.filter(u=>u.kind===d).map(u=>[u.start,u.end]);for(let[u,c]of et(a,e,t))s.push({start:u,end:c,kind:d,past:c<=i})}s.sort((d,a)=>d.start-a.start);let o=i>=e&&i<=t;return{geometry:r,forecast:s,nowPercent:o?Rt(i,e,t):void 0}}var he=10,nt={sunny:"mdi:white-balance-sunny",shaded:"mdi:weather-sunny-off",sunny_cloudy:"mdi:weather-partly-cloudy",unavailable:"mdi:help-circle-outline"},Nt={sunny:"legend_sunny",partly:"legend_partly",unlikely:"legend_unlikely",geometry:"legend_geometry"};function K(n){return n.locale?.language??n.language??"en"}function ge(n,e){let t=de(n,"friendly_name");if(!t)return e;let i=t.replace(/\s+(sunny|sonnig)$/i,"").trim();return i===""?t:i}function Ht(n,e){let t=n.config.time_zone;return{hass:n,language:K(n),tz:t,dayStart:me(e,t),now:Qe(e,t)}}function T(n,e){return B(e,n.tz,n.dayStart)}function Pt(n,e){let t=e?.attributes.intervals_today;if(!Array.isArray(t))return[];let i=[];for(let r of t){if(!Array.isArray(r))continue;let s=T(n,r[0]),o=T(n,r[1]);s!==void 0&&o!==void 0&&i.push([s,o])}return i}function Ut(n,e){let t=e?.attributes.windows;if(!Array.isArray(t))return[];let i=[];for(let r of t){if(typeof r!="object"||r===null)continue;let s=r,o=T(n,s.start),d=T(n,s.end),a=s.class;o===void 0||d===void 0||a!=="sunny"&&a!=="partly"&&a!=="unlikely"||i.push({start:o,end:d,kind:a,past:s.past===!0})}return i}function M(n,e){return e===void 0?void 0:n.hass.states[e]}function Ot(n,e){return ae(n)?"unavailable":n?.state!=="on"?"shaded":e&&!ae(e)&&e.state==="off"?"sunny_cloudy":"sunny"}function Dt(n,e,t){let i=n.hass.states[t],r=M(n,e.sunny_weather_aware),s=Ot(i,r),o=(m,f)=>y(n.language,m,f),d={entityId:t,name:ge(i,t),status:s,statusLabel:o(s),icon:nt[s],extras:[]},a=T(n,M(n,e.next_change)?.state);a!==void 0&&s!=="unavailable"&&(d.boundary=le(i?.state==="on"?"until":"from",a,n.language));let u=M(n,e.sun_forecast);if(u?.state==="sunny_later"||u?.state==="partly_later"){let m=u.attributes.best_window,f=typeof m=="object"&&m!==null?T(n,m.start):void 0;f!==void 0&&(d.forecastNote=le(u.state==="sunny_later"?"sun_expected_from":"partly_expected_from",f,n.language))}else u?.state==="no_sun_today"&&(d.forecastNote=o("no_sun_today"));let c=Number(M(n,e.sun_hours_today)?.state);M(n,e.sun_hours_today)&&Number.isFinite(c)&&d.extras.push(o("sun_hours_today",{hours:new Intl.NumberFormat(n.language??"en",{maximumFractionDigits:1}).format(c)}));let l=We(r,"cloud_coverage");return l!==void 0&&s!=="shaded"&&s!=="unavailable"&&d.extras.push(o("cloud_coverage",{percent:Math.round(l)})),d}function zt(n,e,t){let i=(t-e)/60<=10?60:120,r=[];for(let s=Math.ceil(e/i)*i;s<=t;s+=i)r.push({percent:(s-e)/(t-e)*100,label:E(s,n.language)});return r}function Lt(n,e,t,i){let r=n.hass.states[t],s=i.startHour*60,o=i.endHour*60,d=Ut(n,M(n,e.sun_forecast)),a=tt({geometry:Pt(n,r),forecast:d,windowStart:s,windowEnd:o,now:n.now}),u=a.forecast.length>0,c=u?a.forecast:a.geometry,l=(g,st)=>y(n.language,g,st),m=g=>l(Nt[g]),f=c.map(g=>`${m(u?g.kind:"geometry")} ${E(g.start,n.language)}–${E(g.end,n.language)}`),w=ge(r,t),it=u?["sunny","partly","unlikely"]:["geometry"],ve=o-s,rt=c.map(g=>({left:(g.start-s)/ve*100,width:(g.end-g.start)/ve*100,kind:g.kind,past:g.past}));return{entityId:t,name:w,timeline:a,bars:rt,usesForecast:u,legend:it.map(g=>({kind:g,label:m(g)})),ticks:zt(n,s,o),summary:l("timeline_alt",{name:w,summary:f.length>0?f.join("; "):l("timeline_none")}),nowLabel:l("now")}}function fe(n,e,t){return{entityId:e,name:e,error:y(n.language,"entity_missing",{entity:e}),...t}}function It(n,e,t,i){let r=n.hass.states[t],s=i.startHour*60,o=i.endHour*60,d=Math.round(n.now/he)*he,a={minMinute:s,maxMinute:o,step:he,initialMinute:Math.min(o,Math.max(s,d)),dayStart:n.dayStart};if(!r||!e)return fe(n,t,a);let u=de(r,"attribution");return{entityId:t,name:ge(r,t),...a,...u?{attribution:u}:{}}}function ye(n,e,t){let i=Ht(n,t),r=e.title??y(i.language,"default_title"),s=d=>n.states[d]?Be(n,d):void 0;if(e.mode==="map"){let d=e.entities[0];return{mode:"map",title:r,map:It(i,s(d),d,e)}}if(e.mode==="timeline"){let d=e.entities.map(a=>{let u=s(a);return u?Lt(i,u,a,e):fe(i,a,{timeline:{geometry:[],forecast:[],nowPercent:void 0},bars:[],usesForecast:!1,legend:[],ticks:[],summary:"",nowLabel:""})});return{mode:"timeline",title:r,rows:d}}let o=e.entities.map(d=>{let a=s(d);return a?Dt(i,a,d):fe(i,d,{status:"unavailable",statusLabel:"",icon:nt.unavailable,extras:[]})});return{mode:"overview",title:r,rows:o}}var Ft=150,_e=class extends b{constructor(){super();this.debouncer=ze(t=>{this.runner?.request(t)},Ft);this.dayStart=0;this._mapState={status:"idle"}}static{this.properties={hass:{attribute:!1},_config:{state:!0},_mapState:{state:!0},_minute:{state:!0}}}static getStubConfig(t,i){let r=Ke(t,i);return{type:"custom:sunspots-card",mode:"overview",entities:r?[r]:[]}}setConfig(t){this._config=je(t),this.resetMap()}getCardSize(){let t=this._config;return t?t.mode==="map"?8:t.mode==="timeline"?1+t.entities.length*2:1+t.entities.length:1}getGridOptions(){return{columns:12,min_columns:6,rows:(this._config?.mode??"overview")==="map"?6:"auto",min_rows:1}}disconnectedCallback(){super.disconnectedCallback(),this.resetMap()}connectedCallback(){super.connectedCallback(),this.ensureRunner()}updated(){let t=this._config;if(!this.hass||t?.mode!=="map")return;let i=t.entities[0];if(this._mapState.status==="idle"&&i&&this.mapEntity!==i){this.mapEntity=i;let r=this.currentModel();r?.mode==="map"&&!r.map.error&&(this.dayStart=r.map.dayStart,this._minute=r.map.initialMinute,this.startLoading(),this.runner?.request(r.map.initialMinute))}}currentModel(){return this.hass&&this._config?ye(this.hass,this._config,new Date):void 0}ensureRunner(){this.runner||(this.runner=new j(t=>this.fetchMap(t),t=>this.onMapSettled(t)))}resetMap(){this.debouncer.cancel(),this.runner?.dispose(),this.runner=void 0,this.revoke(),this.mapEntity=void 0,this._mapState={status:"idle"},this._minute=void 0,this.isConnected&&this.ensureRunner()}revoke(){this.objectUrl&&URL.revokeObjectURL(this.objectUrl),this.objectUrl=void 0}async fetchMap(t){let i=this.hass,r=this.mapEntity;if(!i||!r)throw new Error("not ready");let s=await i.connection.sendMessagePromise(Ge(r,Ze(t,this.dayStart))),o=Ye(s,r);if(!o.ok)throw new W(o.reason);return o.map}onMapSettled(t){let i=this.hass?K(this.hass):void 0;if(!t.ok){let r=t.error,s=r instanceof W?y(i,r.reason==="too_large"?"map_too_large":"map_invalid"):y(i,"map_error",{message:Je(r)});this.revoke(),this._mapState={status:"error",message:s};return}this.revoke(),this.objectUrl=URL.createObjectURL(new Blob([t.value.svg],{type:"image/svg+xml"})),this._mapState={status:"ready",url:this.objectUrl,map:t.value}}startLoading(){let t=this._mapState;this._mapState=t.status==="ready"?{status:"loading",url:t.url,map:t.map}:{status:"loading"}}onSlide(t){let i=Number(t.target.value);this._minute=i,this.startLoading(),this.debouncer.call(i)}render(){if(!this._config||!this.hass)return h`<ha-card></ha-card>`;let t=ye(this.hass,this._config,new Date),i=K(this.hass);return h`<ha-card .header=${t.title}>
      <div class="content">
        ${t.mode==="overview"?t.rows.map(r=>this.renderOverviewRow(r)):t.mode==="timeline"?this.renderTimeline(t.rows):this.renderMap(t.map,i)}
      </div>
    </ha-card>`}renderOverviewRow(t){if(t.error)return h`<div class="row error">${t.error}</div>`;let i=[t.boundary,t.forecastNote,...t.extras].filter(r=>!!r);return h`<div class="row">
      <div class="name">${t.name}</div>
      <div class="chip ${t.status}">
        <ha-icon icon=${t.icon}></ha-icon><span>${t.statusLabel}</span>
      </div>
      ${i.length>0?h`<div class="details">${i.join(" · ")}</div>`:p}
    </div>`}renderTimeline(t){return t.map(i=>i.error?h`<div class="row error">${i.error}</div>`:h`<div class="timeline">
        <div class="name">${i.name}</div>
        <div class="bar" role="img" aria-label=${i.summary}>
          ${i.bars.map(r=>h`<div
              class="seg ${r.kind} ${r.past?"past":""}"
              style="left:${r.left}%;width:${r.width}%"
            ></div>`)}
          ${i.timeline.nowPercent!==void 0?h`<div class="now" style="left:${i.timeline.nowPercent}%" title=${i.nowLabel}></div>`:p}
        </div>
        <div class="ticks" aria-hidden="true">
          ${i.ticks.map(r=>h`<span style="left:${r.percent}%">${r.label}</span>`)}
        </div>
        <ul class="legend">
          ${i.legend.map(r=>h`<li><span class="swatch seg ${r.kind==="geometry"?"sunny":r.kind}"></span>${r.label}</li>`)}
        </ul>
      </div>`)}renderMap(t,i){if(t.error)return h`<div class="row error">${t.error}</div>`;let r=(m,f)=>y(i,m,f),s=this._mapState,o=this._minute??t.initialMinute,d=E(o,i),a=s.status==="ready"||s.status==="loading"?s.url:void 0,u=s.status==="ready"||s.status==="loading"?s.map:void 0,c=u?.time?B(u.time,this.hass?.config.time_zone??"UTC",t.dayStart):void 0,l=c!==void 0?ue(c,i):u?.time??d;return h`
      <div class="mapbox" aria-busy=${s.status==="loading"?"true":"false"}>
        ${a?h`<img src=${a} alt=${r("map_alt",{name:t.name,time:l})} />`:p}
        ${s.status==="loading"?h`<div class="overlay" role="status">${r("map_loading")}</div>`:p}
        ${s.status==="error"?h`<div class="error" role="alert">${s.message}</div>`:p}
      </div>
      <label class="slider">
        <span>${t.name} · <strong>${d}</strong></span>
        <input
          type="range"
          .min=${String(t.minMinute)}
          .max=${String(t.maxMinute)}
          .step=${String(t.step)}
          .value=${String(o)}
          aria-valuetext=${d}
          @input=${this.onSlide}
        />
      </label>
      ${u?h`<div class="meta">
            <div>${r("map_time",{time:l})}</div>
            ${u.sunAzimuth!==void 0&&u.sunElevation!==void 0?h`<div>
                  ${r("azimuth")}: ${ce(u.sunAzimuth,i)} · ${r("elevation")}:
                  ${ce(u.sunElevation,i)}
                </div>`:p}
            ${u.sunBelowHorizon?h`<div>${r("map_sun_below")}</div>`:p}
          </div>`:p}
      ${t.attribution?h`<div class="attribution">${t.attribution}</div>`:p}
    `}static{this.styles=q`
    :host {
      --sunspots-sun: var(--amber-color, var(--warning-color, #f5a623));
    }
    .content {
      padding: 0 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      color: var(--primary-text-color);
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 12px;
    }
    .row .name {
      flex: 1 1 8em;
      font-weight: 500;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .details {
      flex: 1 1 100%;
      color: var(--secondary-text-color);
      font-size: 0.9em;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 10px 2px 6px;
      border-radius: 16px;
      border: 1px solid var(--divider-color);
      font-size: 0.9em;
      white-space: nowrap;
    }
    .chip.sunny {
      border-color: var(--sunspots-sun);
      background: color-mix(in srgb, var(--sunspots-sun) 18%, transparent);
    }
    .chip.sunny_cloudy {
      border-color: var(--sunspots-sun);
      border-style: dashed;
    }
    .chip ha-icon {
      --mdc-icon-size: 18px;
    }
    .error {
      color: var(--error-color, #db4437);
    }
    .timeline .name {
      font-weight: 500;
      margin-bottom: 4px;
    }
    .bar {
      position: relative;
      height: 22px;
      border-radius: 4px;
      border: 1px solid var(--divider-color);
      background: var(--secondary-background-color, transparent);
      overflow: hidden;
    }
    .seg {
      position: absolute;
      top: 0;
      bottom: 0;
    }
    .seg.sunny {
      background: var(--sunspots-sun);
    }
    .seg.partly {
      background: repeating-linear-gradient(
        45deg,
        var(--sunspots-sun) 0 4px,
        transparent 4px 8px
      );
      border-left: 1px solid var(--sunspots-sun);
      border-right: 1px solid var(--sunspots-sun);
    }
    .seg.unlikely {
      background: color-mix(in srgb, var(--sunspots-sun) 22%, transparent);
      border-top: 2px dotted var(--sunspots-sun);
      border-bottom: 2px dotted var(--sunspots-sun);
      box-sizing: border-box;
    }
    .seg.past:not(.swatch) {
      opacity: 0.55;
    }
    .now {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      margin-left: -1px;
      background: var(--primary-text-color);
    }
    .ticks {
      position: relative;
      height: 1.2em;
      font-size: 0.75em;
      color: var(--secondary-text-color);
    }
    .ticks span {
      position: absolute;
      transform: translateX(-50%);
      white-space: nowrap;
    }
    .legend {
      list-style: none;
      margin: 4px 0 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 4px 16px;
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .legend li {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .swatch {
      position: static;
      display: inline-block;
      width: 24px;
      height: 12px;
      border: 1px solid var(--divider-color);
    }
    .mapbox {
      position: relative;
      min-height: 120px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      overflow: hidden;
    }
    .mapbox img {
      display: block;
      width: 100%;
      height: auto;
    }
    .overlay,
    .mapbox .error {
      position: absolute;
      inset: auto 0 0 0;
      padding: 6px 10px;
      background: var(--card-background-color);
      font-size: 0.9em;
    }
    .mapbox .error {
      position: static;
    }
    .overlay {
      color: var(--secondary-text-color);
    }
    .slider {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .slider input {
      width: 100%;
      accent-color: var(--primary-color);
    }
    .meta,
    .attribution {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
  `}},W=class extends Error{constructor(t){super(t);this.reason=t}};customElements.define("sunspots-card",_e);window.customCards=window.customCards??[];window.customCards.push({type:"sunspots-card",name:y(navigator.language,"card_name"),description:y(navigator.language,"card_description")});
