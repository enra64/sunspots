var te=globalThis,ne=te.ShadowRoot&&(te.ShadyCSS===void 0||te.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Ee=Symbol(),dt=new WeakMap,q=class{constructor(e,n,r){if(this._$cssResult$=!0,r!==Ee)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=n}get styleSheet(){let e=this.o,n=this.t;if(ne&&e===void 0){let r=n!==void 0&&n.length===1;r&&(e=dt.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),r&&dt.set(n,e))}return e}toString(){return this.cssText}},ut=t=>new q(typeof t=="string"?t:t+"",void 0,Ee),M=(t,...e)=>{let n=t.length===1?t[0]:e.reduce((r,i,o)=>r+(s=>{if(s._$cssResult$===!0)return s.cssText;if(typeof s=="number")return s;throw Error("Value passed to 'css' function must be a 'css' function result: "+s+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[o+1],t[0]);return new q(n,t,Ee)},lt=(t,e)=>{if(ne)t.adoptedStyleSheets=e.map(n=>n instanceof CSSStyleSheet?n:n.styleSheet);else for(let n of e){let r=document.createElement("style"),i=te.litNonce;i!==void 0&&r.setAttribute("nonce",i),r.textContent=n.cssText,t.appendChild(r)}},Re=ne?t=>t:t=>t instanceof CSSStyleSheet?(e=>{let n="";for(let r of e.cssRules)n+=r.cssText;return ut(n)})(t):t;var{is:_n,defineProperty:yn,getOwnPropertyDescriptor:bn,getOwnPropertyNames:wn,getOwnPropertySymbols:vn,getPrototypeOf:Sn}=Object,re=globalThis,ct=re.trustedTypes,xn=ct?ct.emptyScript:"",$n=re.reactiveElementPolyfillSupport,V=(t,e)=>t,Ae={toAttribute(t,e){switch(e){case Boolean:t=t?xn:null;break;case Object:case Array:t=t==null?t:JSON.stringify(t)}return t},fromAttribute(t,e){let n=t;switch(e){case Boolean:n=t!==null;break;case Number:n=t===null?null:Number(t);break;case Object:case Array:try{n=JSON.parse(t)}catch{n=null}}return n}},pt=(t,e)=>!_n(t,e),mt={attribute:!0,type:String,converter:Ae,reflect:!1,useDefault:!1,hasChanged:pt};Symbol.metadata??=Symbol("metadata"),re.litPropertyMetadata??=new WeakMap;var $=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,n=mt){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(e,n),!n.noAccessor){let r=Symbol(),i=this.getPropertyDescriptor(e,r,n);i!==void 0&&yn(this.prototype,e,i)}}static getPropertyDescriptor(e,n,r){let{get:i,set:o}=bn(this.prototype,e)??{get(){return this[n]},set(s){this[n]=s}};return{get:i,set(s){let a=i?.call(this);o?.call(this,s),this.requestUpdate(e,a,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??mt}static _$Ei(){if(this.hasOwnProperty(V("elementProperties")))return;let e=Sn(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(V("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(V("properties"))){let n=this.properties,r=[...wn(n),...vn(n)];for(let i of r)this.createProperty(i,n[i])}let e=this[Symbol.metadata];if(e!==null){let n=litPropertyMetadata.get(e);if(n!==void 0)for(let[r,i]of n)this.elementProperties.set(r,i)}this._$Eh=new Map;for(let[n,r]of this.elementProperties){let i=this._$Eu(n,r);i!==void 0&&this._$Eh.set(i,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let n=[];if(Array.isArray(e)){let r=new Set(e.flat(1/0).reverse());for(let i of r)n.unshift(Re(i))}else e!==void 0&&n.push(Re(e));return n}static _$Eu(e,n){let r=n.attribute;return r===!1?void 0:typeof r=="string"?r:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,n=this.constructor.elementProperties;for(let r of n.keys())this.hasOwnProperty(r)&&(e.set(r,this[r]),delete this[r]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return lt(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,n,r){this._$AK(e,r)}_$ET(e,n){let r=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,r);if(i!==void 0&&r.reflect===!0){let o=(r.converter?.toAttribute!==void 0?r.converter:Ae).toAttribute(n,r.type);this._$Em=e,o==null?this.removeAttribute(i):this.setAttribute(i,o),this._$Em=null}}_$AK(e,n){let r=this.constructor,i=r._$Eh.get(e);if(i!==void 0&&this._$Em!==i){let o=r.getPropertyOptions(i),s=typeof o.converter=="function"?{fromAttribute:o.converter}:o.converter?.fromAttribute!==void 0?o.converter:Ae;this._$Em=i;let a=s.fromAttribute(n,o.type);this[i]=a??this._$Ej?.get(i)??a,this._$Em=null}}requestUpdate(e,n,r,i=!1,o){if(e!==void 0){let s=this.constructor;if(i===!1&&(o=this[e]),r??=s.getPropertyOptions(e),!((r.hasChanged??pt)(o,n)||r.useDefault&&r.reflect&&o===this._$Ej?.get(e)&&!this.hasAttribute(s._$Eu(e,r))))return;this.C(e,n,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,n,{useDefault:r,reflect:i,wrapped:o},s){r&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,s??n??this[e]),o!==!0||s!==void 0)||(this._$AL.has(e)||(this.hasUpdated||r||(n=void 0),this._$AL.set(e,n)),i===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[i,o]of this._$Ep)this[i]=o;this._$Ep=void 0}let r=this.constructor.elementProperties;if(r.size>0)for(let[i,o]of r){let{wrapped:s}=o,a=this[i];s!==!0||this._$AL.has(i)||a===void 0||this.C(i,void 0,o,a)}}let e=!1,n=this._$AL;try{e=this.shouldUpdate(n),e?(this.willUpdate(n),this._$EO?.forEach(r=>r.hostUpdate?.()),this.update(n)):this._$EM()}catch(r){throw e=!1,this._$EM(),r}e&&this._$AE(n)}willUpdate(e){}_$AE(e){this._$EO?.forEach(n=>n.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(n=>this._$ET(n,this[n])),this._$EM()}updated(e){}firstUpdated(e){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[V("elementProperties")]=new Map,$[V("finalized")]=new Map,$n?.({ReactiveElement:$}),(re.reactiveElementVersions??=[]).push("2.1.2");var Oe=globalThis,ht=t=>t,ie=Oe.trustedTypes,ft=ie?ie.createPolicy("lit-html",{createHTML:t=>t}):void 0,vt="$lit$",R=`lit$${Math.random().toFixed(9).slice(2)}$`,St="?"+R,En=`<${St}>`,H=document,X=()=>H.createComment(""),Z=t=>t===null||typeof t!="object"&&typeof t!="function",Ne=Array.isArray,Rn=t=>Ne(t)||typeof t?.[Symbol.iterator]=="function",Ce=`[ 	
\f\r]`,G=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,gt=/-->/g,_t=/>/g,k=RegExp(`>|${Ce}(?:([^\\s"'>=/]+)(${Ce}*=${Ce}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),yt=/'/g,bt=/"/g,xt=/^(?:script|style|textarea|title)$/i,Ue=t=>(e,...n)=>({_$litType$:t,strings:e,values:n}),p=Ue(1),wr=Ue(2),vr=Ue(3),D=Symbol.for("lit-noChange"),m=Symbol.for("lit-nothing"),wt=new WeakMap,T=H.createTreeWalker(H,129);function $t(t,e){if(!Ne(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return ft!==void 0?ft.createHTML(e):e}var An=(t,e)=>{let n=t.length-1,r=[],i,o=e===2?"<svg>":e===3?"<math>":"",s=G;for(let a=0;a<n;a++){let d=t[a],u,c,l=-1,f=0;for(;f<d.length&&(s.lastIndex=f,c=s.exec(d),c!==null);)f=s.lastIndex,s===G?c[1]==="!--"?s=gt:c[1]!==void 0?s=_t:c[2]!==void 0?(xt.test(c[2])&&(i=RegExp("</"+c[2],"g")),s=k):c[3]!==void 0&&(s=k):s===k?c[0]===">"?(s=i??G,l=-1):c[1]===void 0?l=-2:(l=s.lastIndex-c[2].length,u=c[1],s=c[3]===void 0?k:c[3]==='"'?bt:yt):s===bt||s===yt?s=k:s===gt||s===_t?s=G:(s=k,i=void 0);let g=s===k&&t[a+1].startsWith("/>")?" ":"";o+=s===G?d+En:l>=0?(r.push(u),d.slice(0,l)+vt+d.slice(l)+R+g):d+R+(l===-2?a:g)}return[$t(t,o+(t[n]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),r]},J=class t{constructor({strings:e,_$litType$:n},r){let i;this.parts=[];let o=0,s=0,a=e.length-1,d=this.parts,[u,c]=An(e,n);if(this.el=t.createElement(u,r),T.currentNode=this.el.content,n===2||n===3){let l=this.el.content.firstChild;l.replaceWith(...l.childNodes)}for(;(i=T.nextNode())!==null&&d.length<a;){if(i.nodeType===1){if(i.hasAttributes())for(let l of i.getAttributeNames())if(l.endsWith(vt)){let f=c[s++],g=i.getAttribute(l).split(R),y=/([.?@])?(.*)/.exec(f);d.push({type:1,index:o,name:y[2],strings:g,ctor:y[1]==="."?ke:y[1]==="?"?Te:y[1]==="@"?He:I}),i.removeAttribute(l)}else l.startsWith(R)&&(d.push({type:6,index:o}),i.removeAttribute(l));if(xt.test(i.tagName)){let l=i.textContent.split(R),f=l.length-1;if(f>0){i.textContent=ie?ie.emptyScript:"";for(let g=0;g<f;g++)i.append(l[g],X()),T.nextNode(),d.push({type:2,index:++o});i.append(l[f],X())}}}else if(i.nodeType===8)if(i.data===St)d.push({type:2,index:o});else{let l=-1;for(;(l=i.data.indexOf(R,l+1))!==-1;)d.push({type:7,index:o}),l+=R.length-1}o++}}static createElement(e,n){let r=H.createElement("template");return r.innerHTML=e,r}};function P(t,e,n=t,r){if(e===D)return e;let i=r!==void 0?n._$Co?.[r]:n._$Cl,o=Z(e)?void 0:e._$litDirective$;return i?.constructor!==o&&(i?._$AO?.(!1),o===void 0?i=void 0:(i=new o(t),i._$AT(t,n,r)),r!==void 0?(n._$Co??=[])[r]=i:n._$Cl=i),i!==void 0&&(e=P(t,i._$AS(t,e.values),i,r)),e}var Me=class{constructor(e,n){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:n},parts:r}=this._$AD,i=(e?.creationScope??H).importNode(n,!0);T.currentNode=i;let o=T.nextNode(),s=0,a=0,d=r[0];for(;d!==void 0;){if(s===d.index){let u;d.type===2?u=new Q(o,o.nextSibling,this,e):d.type===1?u=new d.ctor(o,d.name,d.strings,this,e):d.type===6&&(u=new De(o,this,e)),this._$AV.push(u),d=r[++a]}s!==d?.index&&(o=T.nextNode(),s++)}return T.currentNode=H,i}p(e){let n=0;for(let r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(e,r,n),n+=r.strings.length-2):r._$AI(e[n])),n++}},Q=class t{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,n,r,i){this.type=2,this._$AH=m,this._$AN=void 0,this._$AA=e,this._$AB=n,this._$AM=r,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,n=this._$AM;return n!==void 0&&e?.nodeType===11&&(e=n.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,n=this){e=P(this,e,n),Z(e)?e===m||e==null||e===""?(this._$AH!==m&&this._$AR(),this._$AH=m):e!==this._$AH&&e!==D&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Rn(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==m&&Z(this._$AH)?this._$AA.nextSibling.data=e:this.T(H.createTextNode(e)),this._$AH=e}$(e){let{values:n,_$litType$:r}=e,i=typeof r=="number"?this._$AC(e):(r.el===void 0&&(r.el=J.createElement($t(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===i)this._$AH.p(n);else{let o=new Me(i,this),s=o.u(this.options);o.p(n),this.T(s),this._$AH=o}}_$AC(e){let n=wt.get(e.strings);return n===void 0&&wt.set(e.strings,n=new J(e)),n}k(e){Ne(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let o of e)i===n.length?n.push(r=new t(this.O(X()),this.O(X()),this,this.options)):r=n[i],r._$AI(o),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);e!==this._$AB;){let r=ht(e).nextSibling;ht(e).remove(),e=r}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},I=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,n,r,i,o){this.type=1,this._$AH=m,this._$AN=void 0,this.element=e,this.name=n,this._$AM=i,this.options=o,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=m}_$AI(e,n=this,r,i){let o=this.strings,s=!1;if(o===void 0)e=P(this,e,n,0),s=!Z(e)||e!==this._$AH&&e!==D,s&&(this._$AH=e);else{let a=e,d,u;for(e=o[0],d=0;d<o.length-1;d++)u=P(this,a[r+d],n,d),u===D&&(u=this._$AH[d]),s||=!Z(u)||u!==this._$AH[d],u===m?e=m:e!==m&&(e+=(u??"")+o[d+1]),this._$AH[d]=u}s&&!i&&this.j(e)}j(e){e===m?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},ke=class extends I{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===m?void 0:e}},Te=class extends I{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==m)}},He=class extends I{constructor(e,n,r,i,o){super(e,n,r,i,o),this.type=5}_$AI(e,n=this){if((e=P(this,e,n,0)??m)===D)return;let r=this._$AH,i=e===m&&r!==m||e.capture!==r.capture||e.once!==r.once||e.passive!==r.passive,o=e!==m&&(r===m||i);i&&this.element.removeEventListener(this.name,this,r),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},De=class{constructor(e,n,r){this.element=e,this.type=6,this._$AN=void 0,this._$AM=n,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(e){P(this,e)}};var Cn=Oe.litHtmlPolyfillSupport;Cn?.(J,Q),(Oe.litHtmlVersions??=[]).push("3.3.3");var Et=(t,e,n)=>{let r=n?.renderBefore??e,i=r._$litPart$;if(i===void 0){let o=n?.renderBefore??null;r._$litPart$=i=new Q(e.insertBefore(X(),o),o,void 0,n??{})}return i._$AI(t),i};var Le=globalThis,v=class extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Et(n,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return D}};v._$litElement$=!0,v.finalized=!0,Le.litElementHydrateSupport?.({LitElement:v});var Mn=Le.litElementPolyfillSupport;Mn?.({LitElement:v});(Le.litElementVersions??=[]).push("4.2.2");function se(t,e){let n;return{call(...r){n!==void 0&&clearTimeout(n),n=setTimeout(()=>{n=void 0,t(...r)},e)},cancel(){n!==void 0&&clearTimeout(n),n=void 0}}}var Pe=class{constructor(){this.latest=0}next(){return this.latest+=1,this.latest}isCurrent(e){return e===this.latest}},oe=class{constructor(e,n){this.task=e;this.onSettled=n;this.guard=new Pe;this.busy=!1;this.disposed=!1}request(e){this.disposed||(this.pending={arg:e,id:this.guard.next()},this.busy||this.drain())}dispose(){this.disposed=!0,this.pending=void 0}async drain(){for(this.busy=!0;this.pending&&!this.disposed;){let{arg:e,id:n}=this.pending;this.pending=void 0;let r;try{r={ok:!0,value:await this.task(e)}}catch(i){r={ok:!1,error:i}}!this.disposed&&this.guard.isCurrent(n)&&this.onSettled(r)}this.busy=!1}};var Rt=["overview","timeline","map"],kn=/^binary_sensor\.[a-z0-9_]+$/,Tn=["auto","light","dark"];var Ke={overview:[6,22],timeline:["auto","auto"],map:[4,23]},S=[4,23];function Ct(t){return typeof t=="object"&&t!==null&&!Array.isArray(t)}function Ie(t,e,n){if(t===void 0)return n;if(typeof t!="number"||!Number.isInteger(t)||t<0||t>24)throw new Error(`Invalid configuration: "${e}" must be an integer between 0 and 24`);return t}function At(t,e,n,r){return t===void 0?n:r&&t==="auto"?t:Ie(t,e,0)}function Fe(t){if(typeof t!="string"||!kn.test(t))throw new Error(`Invalid configuration: "${String(t)}" is not a binary_sensor entity id (use the spot's "..._sunny" entity)`);return t}function Mt(t){if(!Ct(t))throw new Error("Invalid configuration: expected an object");let e=(()=>{if(t.mode===void 0)return"overview";let w=Rt.find(L=>L===t.mode);if(!w)throw new Error(`Invalid configuration: "mode" must be one of ${Rt.join(", ")}`);return w})(),{entities:n,entity:r}=t;if(n!==void 0&&r!==void 0)throw new Error('Invalid configuration: use either "entity" or "entities", not both');let i;if(n!==void 0){if(!Array.isArray(n))throw new Error('Invalid configuration: "entities" must be a list of entity ids');i=n.map(Fe)}else r!==void 0?i=[Fe(r)]:i=[];if(i.length===0)throw new Error('Invalid configuration: "entity" or "entities" is required');let o=t.title;if(o!==void 0&&typeof o!="string")throw new Error('Invalid configuration: "title" must be a string');let[s,a]=Ke[e],d=e==="timeline",u=At(t.start_hour,"start_hour",s,d),c=At(t.end_hour,"end_hour",a,d);if(typeof u=="number"&&typeof c=="number"&&u>=c)throw new Error('Invalid configuration: "start_hour" must be smaller than "end_hour"');let l=ae(t.show_today,"show_today",!0),f=ae(t.show_tomorrow,"show_tomorrow",!0);if(e==="timeline"&&!l&&!f)throw new Error('Invalid configuration: "show_today" and "show_tomorrow" cannot both be false, show at least one day');let g=ae(t.full_day,"full_day",!1);return{type:typeof t.type=="string"?t.type:"custom:sunspots-card",mode:e,entities:i,...o!==void 0?{title:o}:{},startHour:u,endHour:c,showToday:l,showTomorrow:f,fullDay:g}}function ae(t,e,n){if(t===void 0)return n;if(typeof t!="boolean")throw new Error(`Invalid configuration: "${e}" must be true or false`);return t}function Hn(t,e,n,r){if(t===void 0)return n;let i=e.find(o=>o===t);if(!i)throw new Error(`Invalid configuration: "${r}" must be one of ${e.join(", ")}`);return i}function Dn(t){if(t===void 0)return 5;if(typeof t!="number"||!Number.isFinite(t))throw new Error('Invalid configuration: "refresh_minutes" must be a number');return Math.min(60,Math.max(1,Math.round(t)))}function kt(t){if(!Ct(t))throw new Error("Invalid configuration: expected an object");let{entity:e,entities:n}=t,r=e;if(r===void 0){if(n!==void 0&&!Array.isArray(n))throw new Error('Invalid configuration: "entities" must be a list of entity ids');r=n?.[0]}if(r===void 0)throw new Error('Invalid configuration: "entity" is required');let i=t.title;if(i!==void 0&&typeof i!="string")throw new Error('Invalid configuration: "title" must be a string');let o=ae(t.show_slider,"show_slider",!1),s=Ie(t.start_hour,"start_hour",S[0]),a=Ie(t.end_hour,"end_hour",S[1]);if(s>=a)throw new Error('Invalid configuration: "start_hour" must be smaller than "end_hour"');return{type:typeof t.type=="string"?t.type:"custom:sunspots-shadow-card",entity:Fe(r),...i!==void 0?{title:i}:{},theme:Hn(t.theme,Tn,"auto","theme"),refreshMinutes:Dn(t.refresh_minutes),showSlider:o,startHour:s,endHour:a}}var On={sunny:"Sunny",shaded:"Shaded",sunny_cloudy:"Sun, but cloudy",unavailable:"Unavailable",until:"until {time}",from:"from {time}",tomorrow:"tomorrow",sun_expected_from:"sun expected from {time}",partly_expected_from:"partly sunny from {time}",no_sun_today:"no sun today",sun_hours_today:"{hours} h of sun today",cloud_coverage:"{percent}% clouds",legend_sunny:"Sunny",legend_partly:"Partly sunny",legend_unlikely:"Sun unlikely",legend_geometry:"Sun (no weather forecast)",now:"Now",timeline_bar_alt:"{name}, {day}: {summary}",timeline_none:"no sun in this period",day_today:"Today",day_tomorrow:"Tomorrow",sun_summary:"Sun: {ranges} · {hours}",partly_summary:"Partly sunny: {ranges} · {hours}",no_direct_sun:"No direct sun",first_sun:"first sun {time}",hours_short:"{hours} h",refresh:"Refresh",map_time:"Shown for {time}",map_alt:"Shadow map of {name} at {time}",map_loading:"Loading map…",map_error:"The map could not be loaded: {message}",map_too_large:"The map is too large to display.",map_invalid:"The map response was invalid.",map_sun_below:"The sun is below the horizon.",azimuth:"Azimuth",elevation:"Elevation",entity_missing:"Entity not found: {entity}",default_title:"Sunspots",card_name:"Sunspots",card_description:"Sun and shade status, timeline and shadow map for your spots",shadow_card_name:"Sunspots shadow map",shadow_card_description:"Current shadow map of one spot, refreshed automatically, with dark mode",editor_mode:"Card view",editor_mode_overview:"Overview",editor_mode_timeline:"Timeline",editor_mode_map:"Shadow map",editor_entities:"Spots",editor_entities_helper:"Sunny sensors (binary_sensor.<spot>_sunny) of the Sunspots integration",editor_entity:"Spot",editor_entity_helper:"The spot's sunny sensor (binary_sensor.<spot>_sunny)",editor_title:"Title",editor_show_today:"Show today",editor_show_tomorrow:"Show tomorrow",editor_full_day:"Full day (0-24 h)",editor_full_day_helper:"Always shows the whole day, ignoring start and end hour",editor_start_hour:"Start hour",editor_end_hour:"End hour",editor_hours_helper_timeline:"Hour 0-24; empty means automatic",editor_hours_helper_slider:"Hour 0-24 for the time slider range",editor_theme:"Theme of the map",editor_theme_helper:"Automatic follows the Home Assistant dark mode",editor_theme_auto:"Automatic",editor_theme_light:"Light",editor_theme_dark:"Dark",editor_refresh_minutes:"Refresh interval (minutes)",editor_refresh_minutes_helper:"1 to 60 minutes",editor_show_slider:"Show time slider"},Nn={sunny:"Sonnig",shaded:"Schatten",sunny_cloudy:"Sonne, aber bewölkt",unavailable:"Nicht verfügbar",until:"bis {time}",from:"ab {time}",tomorrow:"morgen",sun_expected_from:"Sonne erwartet ab {time}",partly_expected_from:"teils sonnig ab {time}",no_sun_today:"heute keine Sonne",sun_hours_today:"{hours} Std. Sonne heute",cloud_coverage:"{percent} % Wolken",legend_sunny:"Sonnig",legend_partly:"Teils sonnig",legend_unlikely:"Sonne unwahrscheinlich",legend_geometry:"Sonne (ohne Wettervorhersage)",now:"Jetzt",timeline_bar_alt:"{name}, {day}: {summary}",timeline_none:"keine Sonne in diesem Zeitraum",day_today:"Heute",day_tomorrow:"Morgen",sun_summary:"Sonne: {ranges} · {hours}",partly_summary:"Teils sonnig: {ranges} · {hours}",no_direct_sun:"Keine direkte Sonne",first_sun:"erste Sonne {time}",hours_short:"{hours} Std.",refresh:"Aktualisieren",map_time:"Dargestellt für {time}",map_alt:"Schattenkarte von {name} um {time}",map_loading:"Karte wird geladen …",map_error:"Die Karte konnte nicht geladen werden: {message}",map_too_large:"Die Karte ist zu groß für die Anzeige.",map_invalid:"Die Antwort für die Karte war ungültig.",map_sun_below:"Die Sonne steht unter dem Horizont.",azimuth:"Azimut",elevation:"Höhe",entity_missing:"Entität nicht gefunden: {entity}",default_title:"Sunspots",card_name:"Sunspots",card_description:"Sonnen- und Schattenstatus, Zeitleiste und Schattenkarte für deine Orte",shadow_card_name:"Sunspots Schattenkarte",shadow_card_description:"Aktuelle Schattenkarte eines Ortes, automatisch aktualisiert, mit Dunkelmodus",editor_mode:"Ansicht",editor_mode_overview:"Übersicht",editor_mode_timeline:"Zeitleiste",editor_mode_map:"Schattenkarte",editor_entities:"Orte",editor_entities_helper:"Sonnig-Sensoren (binary_sensor.<ort>_sunny) der Sunspots-Integration",editor_entity:"Ort",editor_entity_helper:"Der Sonnig-Sensor des Ortes (binary_sensor.<ort>_sunny)",editor_title:"Titel",editor_show_today:"Heute anzeigen",editor_show_tomorrow:"Morgen anzeigen",editor_full_day:"Ganzer Tag (0-24 Uhr)",editor_full_day_helper:"Zeigt immer den ganzen Tag, Start- und Endstunde werden ignoriert",editor_start_hour:"Startstunde",editor_end_hour:"Endstunde",editor_hours_helper_timeline:"Stunde 0-24; leer bedeutet automatisch",editor_hours_helper_slider:"Stunde 0-24 für den Bereich des Zeitreglers",editor_theme:"Darstellung der Karte",editor_theme_helper:"Automatisch folgt dem Dunkelmodus von Home Assistant",editor_theme_auto:"Automatisch",editor_theme_light:"Hell",editor_theme_dark:"Dunkel",editor_refresh_minutes:"Aktualisierung (Minuten)",editor_refresh_minutes_helper:"1 bis 60 Minuten",editor_show_slider:"Zeitregler anzeigen"},Un={en:On,de:Nn};function Ln(t){return(t??"en").toLowerCase().split(/[-_]/)[0]||"en"}function h(t,e,n={},r=Un){return(r[Ln(t)]?.[e]??r.en?.[e]??e).replace(/\{(\w+)\}/g,(o,s)=>{let a=n[s];return a===void 0?o:String(a)})}var Pn={mode:"editor_mode",entities:"editor_entities",entity:"editor_entity",title:"editor_title",show_today:"editor_show_today",show_tomorrow:"editor_show_tomorrow",full_day:"editor_full_day",start_hour:"editor_start_hour",end_hour:"editor_end_hour",theme:"editor_theme",refresh_minutes:"editor_refresh_minutes",show_slider:"editor_show_slider"},In={entities:"editor_entities_helper",entity:"editor_entity_helper",full_day:"editor_full_day_helper",theme:"editor_theme_helper",refresh_minutes:"editor_refresh_minutes_helper"},Fn={overview:"editor_mode_overview",timeline:"editor_mode_timeline",map:"editor_mode_map"},Kn={auto:"editor_theme_auto",light:"editor_theme_light",dark:"editor_theme_dark"},F={number:{min:0,max:24,step:1,mode:"box"}};function K(t){let e=t.mode;return e==="timeline"||e==="map"?e:"overview"}function Tt(t,e){return Object.keys(t).map(n=>({value:n,label:h(e,t[n])}))}function Ht(t,e){let n=K(t),r=[{name:"mode",selector:{select:{mode:"dropdown",options:Tt(Fn,e)}}},{name:"entities",required:!0,selector:{entity:{multiple:!0,integration:"sunspots",domain:"binary_sensor"}}},{name:"title",selector:{text:{}}}];return n==="timeline"?(r.push({name:"show_today",selector:{boolean:{}}},{name:"show_tomorrow",selector:{boolean:{}}},{name:"full_day",selector:{boolean:{}}}),t.full_day!==!0&&r.push({name:"start_hour",selector:F},{name:"end_hour",selector:F})):n==="map"&&r.push({name:"start_hour",selector:F},{name:"end_hour",selector:F}),r}function Dt(t,e){let n=[{name:"entity",required:!0,selector:{entity:{integration:"sunspots",domain:"binary_sensor"}}},{name:"title",selector:{text:{}}},{name:"theme",selector:{select:{mode:"dropdown",options:Tt(Kn,e)}}},{name:"refresh_minutes",selector:{number:{min:1,max:60,step:1,mode:"box"}}},{name:"show_slider",selector:{boolean:{}}}];return t.show_slider===!0&&n.push({name:"start_hour",selector:F},{name:"end_hour",selector:F}),n}function Ot(t,e){let n=Pn[t];return n?h(e,n):t}function Nt(t,e,n){if(t==="start_hour"||t==="end_hour")return h(e,n==="timeline"?"editor_hours_helper_timeline":"editor_hours_helper_slider");let r=In[t];return r?h(e,r):""}var Bn="custom:sunspots-card",Wn="custom:sunspots-shadow-card",Yn=["type","mode","entities","entity","title","show_today","show_tomorrow","full_day","start_hour","end_hour"],qn=["type","entity","entities","title","theme","refresh_minutes","show_slider","start_hour","end_hour"];function ze(t){return typeof t=="object"&&t!==null&&!Array.isArray(t)?{...t}:{}}function de(t){return(Array.isArray(t)?t:[t]).filter(n=>typeof n=="string"&&n!=="")}function Lt(t){let e=de(t.entities);return e.length>0?e:de(t.entity)}function O(t){let e=typeof t=="string"&&t.trim()!==""?Number(t):t;return typeof e=="number"&&Number.isFinite(e)?e:void 0}function ue(t,e){let n=O(t);if(n===void 0)return;let r=Math.min(24,Math.max(0,Math.round(n)));return r===e?void 0:r}function z(t){return typeof t=="string"&&t.trim()!==""?t:void 0}function Pt(t,e,n,r){let i={};for(let o of t)e[o]!==void 0&&(i[o]=e[o]);for(let o of[r,n])for(let[s,a]of Object.entries(o))!t.includes(s)&&a!==void 0&&(i[s]=a);return i}function It(t){let{entity:e,...n}=t,r=K(t);return{...n,mode:r,entities:Lt(t),show_today:t.show_today!==!1,show_tomorrow:t.show_tomorrow!==!1,full_day:t.full_day===!0,...r==="map"?{start_hour:O(t.start_hour)??S[0],end_hour:O(t.end_hour)??S[1]}:{}}}function Ft(t,e={}){let n=K(t),[r,i]=Ke[n],o=a=>typeof a=="number"?a:void 0,s={type:typeof t.type=="string"?t.type:z(e.type)??Bn,mode:n==="overview"?void 0:n,entities:Lt(t),title:z(t.title),show_today:t.show_today===!1?!1:void 0,show_tomorrow:t.show_tomorrow===!1?!1:void 0,full_day:t.full_day===!0?!0:void 0,start_hour:ue(t.start_hour,o(r)),end_hour:ue(t.end_hour,o(i))};return Pt(Yn,s,t,e)}function Kt(t){let{entities:e,...n}=t;return{...n,entity:z(t.entity)??de(e)[0]??"",theme:t.theme??"auto",refresh_minutes:O(t.refresh_minutes)??5,show_slider:t.show_slider===!0,start_hour:O(t.start_hour)??S[0],end_hour:O(t.end_hour)??S[1]}}function zt(t,e={}){let n=O(t.refresh_minutes),r=n===void 0?void 0:Math.min(60,Math.max(1,Math.round(n))),i=t.theme,o={type:typeof t.type=="string"?t.type:z(e.type)??Wn,entity:z(t.entity)??de(t.entities)[0]??"",title:z(t.title),theme:i==="light"||i==="dark"?i:void 0,refresh_minutes:r===5?void 0:r,show_slider:t.show_slider===!0?!0:void 0,start_hour:ue(t.start_hour,S[0]),end_hour:ue(t.end_hour,S[1])};return Pt(qn,o,t,e)}function jt(t){return new CustomEvent("config-changed",{detail:{config:t},bubbles:!0,composed:!0})}var Vn=["sunny","sunny_weather_aware","next_change","sun_remaining","sun_hours_today","sun_forecast","sun_tomorrow"];function Gn(t){return Vn.some(e=>e===t)}function Bt(t,e){let n=t.entities[e];if(!n?.device_id)return;let r={};for(let[i,o]of Object.entries(t.entities))!o||o.device_id!==n.device_id||o.platform!==n.platform||Gn(o.translation_key)&&r[o.translation_key]===void 0&&(r[o.translation_key]=i);return r.sunny=e,r}function le(t,e){return(e.length>0?e:Object.keys(t.entities)).find(r=>{let i=t.entities[r];return r.startsWith("binary_sensor.")&&i?.platform==="sunspots"&&i.translation_key==="sunny"})}function je(t){return!t||t.state==="unavailable"||t.state==="unknown"}function Be(t,e){let n=t?.attributes[e];return typeof n=="string"&&n!==""?n:void 0}function Wt(t,e){let n=t?.attributes[e];return typeof n=="number"&&Number.isFinite(n)?n:void 0}function j(t,e,n){let r=t.map(([o,s])=>[Math.max(o,e),Math.min(s,n)]).filter(([o,s])=>s>o).sort((o,s)=>o[0]-s[0]),i=[];for(let[o,s]of r){let a=i[i.length-1];a&&o<=a[1]?a[1]=Math.max(a[1],s):i.push([o,s])}return i}function Xn(t,e,n){return(t-e)/(n-e)*100}function Yt(t){let{windowStart:e,windowEnd:n,now:r}=t,i=j(t.geometry,e,n).map(([a,d])=>({start:a,end:d,kind:"sunny",past:d<=r})),o=[];for(let a of["unlikely","partly","sunny"]){let d=t.forecast.filter(u=>u.kind===a).map(u=>[u.start,u.end]);for(let[u,c]of j(d,e,n))o.push({start:u,end:c,kind:a,past:c<=r})}o.sort((a,d)=>a.start-d.start);let s=r>=e&&r<=n;return{geometry:i,forecast:o,nowPercent:s?Xn(r,e,n):void 0}}var ce=1440,Zn=[6,22],We={today:0,tomorrow:ce};function me(t,e){let n=[];return t&&n.push("today"),e&&n.push("tomorrow"),n}function qt(t){return t<=720?120:t<=1080?180:240}function Vt(t,e){return t.map(([n,r])=>[n+e,r+e])}function Jn(t){let e=j(t,0,ce),n=e[0],r=e[e.length-1];return!n||!r?Zn:[Math.floor(n[0]/60),Math.ceil(r[1]/60)]}function Gt(t,e,n){let r=Jn(n),i=t==="auto"?r[0]:t,o=e==="auto"?r[1]:e;return o<=i&&(o=Math.min(24,i+1),i=o-1),[i,o]}var Xt=new Map;function Zt(t,e){let n=t??"en",r=`${n}|${e.minute??""}`,i=Xt.get(r);if(!i){try{i=new Intl.DateTimeFormat(n,{...e,timeZone:"UTC"})}catch{i=new Intl.DateTimeFormat("en",{...e,timeZone:"UTC"})}Xt.set(r,i)}return i}function Jt(t,e){let n=(Math.round(t)%1440+1440)%1440;return e.format(new Date(n*6e4))}function A(t,e){return Jt(t,Zt(e,{hour:"2-digit",minute:"2-digit"}))}function Qt(t,e){return Jt(t,Zt(e,{hour:"numeric"}))}function ee(t,e){return new Intl.NumberFormat(e??"en",{maximumFractionDigits:1}).format(t)}function Ye(t,e){let n=A(t,e);return t>=1440?`${h(e,"tomorrow")} ${n}`:n}function qe(t,e,n){return h(n,t,{time:Ye(e,n)})}function Ve(t,e){return`${ee(t,e)}°`}var Qn=90,er=18;function pe(t,e,n){return`${A(t,n)}–${A(e,n)}`}function en(t,e,n,r){if(t.kind!=="sunny")return;let i=t.end-t.start,o=i/(n-e)*100;if(!(i<Qn||o<er))return pe(t.start,t.end,r)}function tr(t){return t.reduce((e,[n,r])=>e+(r-n),0)}function tn(t,e,n){let r=j(t,0,ce);return r.length===0?h(n,"no_direct_sun"):h(n,e?"partly_summary":"sun_summary",{ranges:r.map(([i,o])=>pe(i,o,n)).join(", "),hours:h(n,"hours_short",{hours:ee(tr(r)/60,n)})})}function nn(t,e,n){return e===void 0?t:`${t} · ${h(n,"first_sun",{time:A(e,n)})}`}var rn=new Map;function nr(t){let e=rn.get(t);return e||(e=new Intl.DateTimeFormat("en-US",{timeZone:t,hourCycle:"h23",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric"}),rn.set(t,e)),e}function Ge(t,e){let n={};for(let r of nr(e).formatToParts(t))r.type!=="literal"&&(n[r.type]=Number(r.value));return Date.UTC(n.year??1970,(n.month??1)-1,n.day??1,(n.hour??0)%24,n.minute??0,n.second??0)}function Xe(t,e){return Math.floor(Ge(t,e)/864e5)*864e5}var rr=/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;function he(t,e,n){if(typeof t!="string")return;let r=rr.exec(t.trim());if(!r)return;let i;if(r[7]===void 0)i=Date.UTC(Number(r[1]),Number(r[2])-1,Number(r[3]),Number(r[4]),Number(r[5]),Number(r[6]??0));else{let o=new Date(t.trim());if(Number.isNaN(o.getTime()))return;i=Ge(o,e)}if(!Number.isNaN(i))return(i-n)/6e4}function fe(t,e){return new Date(e+Math.round(t)*6e4).toISOString().slice(0,19)}function on(t,e){return(Ge(t,e)-Xe(t,e))/6e4}var Ze=10,ir=[0,24],Qe={sunny:"mdi:white-balance-sunny",shaded:"mdi:weather-sunny-off",sunny_cloudy:"mdi:weather-partly-cloudy",unavailable:"mdi:help-circle-outline"},dn={sunny:"legend_sunny",partly:"legend_partly",unlikely:"legend_unlikely",geometry:"legend_geometry"};function E(t){return t.locale?.language??t.language??"en"}function tt(t,e){let n=Be(t,"friendly_name");if(!n)return e;let r=n.replace(/\s+(sunny|sonnig)$/i,"").trim();return r===""?n:r}function un(t,e){let n=t.config.time_zone;return{hass:t,language:E(t),tz:n,dayStart:Xe(e,n),now:on(e,n)}}function U(t,e){return he(e,t.tz,t.dayStart)}function Je(t,e){if(!Array.isArray(e))return[];let n=[];for(let r of e){let[i,o]=Array.isArray(r)?[r[0],r[1]]:typeof r=="object"&&r!==null?[r.start,r.end]:[void 0,void 0],s=U(t,i),a=U(t,o);s!==void 0&&a!==void 0&&n.push([s,a])}return n}function sn(t,e){let n=e?.attributes.windows;if(!Array.isArray(n))return[];let r=[];for(let i of n){if(typeof i!="object"||i===null)continue;let o=i,s=U(t,o.start),a=U(t,o.end),d=o.class;s===void 0||a===void 0||d!=="sunny"&&d!=="partly"&&d!=="unlikely"||r.push({start:s,end:a,kind:d,past:o.past===!0})}return r}function N(t,e){return e===void 0?void 0:t.hass.states[e]}function or(t,e){return je(t)?"unavailable":t?.state!=="on"?"shaded":e&&!je(e)&&e.state==="off"?"sunny_cloudy":"sunny"}function ln(t,e,n){let r=N(t,e.sunny_weather_aware),i=or(n,r);return{aware:r,status:i,statusLabel:h(t.language,i),icon:Qe[i]}}function sr(t,e,n){let r=t.hass.states[n],{aware:i,status:o,statusLabel:s,icon:a}=ln(t,e,r),d=(y,w)=>h(t.language,y,w),u={entityId:n,name:tt(r,n),status:o,statusLabel:s,icon:a,extras:[]},c=U(t,N(t,e.next_change)?.state);c!==void 0&&o!=="unavailable"&&(u.boundary=qe(r?.state==="on"?"until":"from",c,t.language));let l=N(t,e.sun_forecast);if(l?.state==="sunny_later"||l?.state==="partly_later"){let y=l.attributes.best_window,w=typeof y=="object"&&y!==null?U(t,y.start):void 0;w!==void 0&&(u.forecastNote=qe(l.state==="sunny_later"?"sun_expected_from":"partly_expected_from",w,t.language))}else l?.state==="no_sun_today"&&(u.forecastNote=d("no_sun_today"));let f=Number(N(t,e.sun_hours_today)?.state);N(t,e.sun_hours_today)&&Number.isFinite(f)&&u.extras.push(d("sun_hours_today",{hours:ee(f,t.language)}));let g=Wt(i,"cloud_coverage");return g!==void 0&&o!=="shaded"&&o!=="unavailable"&&u.extras.push(d("cloud_coverage",{percent:Math.round(g)})),u}function ar(t,e,n){let r=[],i=qt(n-e);for(let o=Math.ceil(e/60)*60;o<=n;o+=60){let s=(o-e)/(n-e)*100;r.push(o%i===0?{percent:s,label:Qt(o,t.language)}:{percent:s})}return r}function dr(t,e,n,r){if(r==="today")return{geometry:Je(t,n?.attributes.intervals_today),windows:sn(t,N(t,e.sun_forecast)),firstSun:void 0};let i=We.tomorrow,o=N(t,e.sun_tomorrow),s=n?.attributes.intervals_tomorrow,a=Array.isArray(s)?Je(t,s):Je(t,o?.attributes.intervals),d=U(t,o?.state);return{geometry:Vt(a,-i),windows:sn(t,o).map(u=>({...u,start:u.start-i,end:u.end-i})),firstSun:d===void 0?void 0:d-i}}function ur(t,e,n,r,i,o){let s=(b,x)=>h(t.language,b,x),a=t.language,d=n.windows.length>0,u=Yt({geometry:n.geometry,forecast:n.windows,windowStart:r,windowEnd:i,now:t.now-We[e]}),c=d?u.forecast:u.geometry,l=i-r,f=c.map(b=>{let x=en(b,r,i,a);return{left:(b.start-r)/l*100,width:(b.end-b.start)/l*100,kind:b.kind,past:b.past,...x?{label:x}:{}}}),g=b=>s(dn[b]),y=c.map(b=>`${g(d?b.kind:"geometry")} ${pe(b.start,b.end,a)}`),w=b=>n.windows.filter(x=>x.kind===b).map(x=>[x.start,x.end]),L=d?w("sunny"):n.geometry,_=d&&L.length===0,C=tn(_?w("partly"):L,_,a),at=s(e==="today"?"day_today":"day_tomorrow");return{key:e,label:at,bars:f,nowPercent:e==="today"?u.nowPercent:void 0,usesForecast:d,summary:e==="tomorrow"?nn(C,n.firstSun,a):C,ariaLabel:s("timeline_bar_alt",{name:o,day:at,summary:y.length>0?y.join("; "):s("timeline_none")})}}function lr(t,e,n,r){let i=t.hass.states[n],o=tt(i,n),s=me(r.showToday,r.showTomorrow).map(_=>({key:_,data:dr(t,e,i,_)})),a=s.flatMap(({data:_})=>[..._.geometry,..._.windows.map(C=>[C.start,C.end])]),[d,u]=r.fullDay?ir:Gt(r.startHour,r.endHour,a),c=d*60,l=u*60,f=s.map(({key:_,data:C})=>ur(t,_,C,c,l,o)),g=[];f.some(_=>_.usesForecast)&&g.push("sunny","partly","unlikely"),f.some(_=>!_.usesForecast&&_.bars.length>0)&&g.push("geometry");let{status:y,statusLabel:w,icon:L}=ln(t,e,i);return{entityId:n,name:o,status:y,statusLabel:w,icon:L,days:f,ticks:ar(t,c,l),legend:g.map(_=>({kind:_,label:h(t.language,dn[_])})),nowLabel:h(t.language,"now")}}function et(t,e,n){return{entityId:e,name:e,error:h(t.language,"entity_missing",{entity:e}),...n}}function an(t,e){return typeof t=="number"?t:e}function cn(t,e,n,r,i){let o=t.hass.states[n],s=r*60,a=i*60,d=Math.round(t.now/Ze)*Ze,u={minMinute:s,maxMinute:a,step:Ze,initialMinute:Math.min(a,Math.max(s,d)),dayStart:t.dayStart};if(!o||!e)return et(t,n,u);let c=Be(o,"attribution");return{entityId:n,name:tt(o,n),...u,...c?{attribution:c}:{}}}function ge(t,e){return t.states[e]?Bt(t,e):void 0}function _e(t,e,n){let r=un(t,n);return{title:e.title??h(r.language,"default_title"),map:cn(r,ge(t,e.entity),e.entity,e.startHour,e.endHour)}}function nt(t,e,n){let r=un(t,n),i=e.title??h(r.language,"default_title");if(e.mode==="map"){let s=e.entities[0],a=an(e.startHour,S[0]),d=an(e.endHour,S[1]);return{mode:"map",title:i,map:cn(r,ge(t,s),s,a,d)}}if(e.mode==="timeline"){let s=e.entities.map(a=>{let d=ge(t,a);return d?lr(r,d,a,e):et(r,a,{status:"unavailable",statusLabel:"",icon:Qe.unavailable,days:[],ticks:[],legend:[],nowLabel:""})});return{mode:"timeline",title:i,rows:s}}let o=e.entities.map(s=>{let a=ge(t,s);return a?sr(r,a,s):et(r,s,{status:"unavailable",statusLabel:"",icon:Qe.unavailable,extras:[]})});return{mode:"overview",title:i,rows:o}}var B=class extends v{static{this.properties={hass:{attribute:!1},_config:{state:!0}}}constructor(){super(),this._config={}}setConfig(e){this._config=ze(e)}onChange(e){e.stopPropagation(),this._config=this.spec.normalize(ze(e.detail.value),this._config),this.dispatchEvent(jt(this._config))}render(){if(!this.hass)return m;let e=E(this.hass),n=this.spec.hourScope(this._config);return p`<ha-form
      .hass=${this.hass}
      .data=${this.spec.formData(this._config)}
      .schema=${this.spec.schema(this._config,e)}
      .computeLabel=${r=>Ot(r.name,e)}
      .computeHelper=${r=>Nt(r.name,e,n)}
      @value-changed=${r=>this.onChange(r)}
    ></ha-form>`}};var cr={schema:Ht,hourScope:t=>K(t)==="timeline"?"timeline":"slider",formData:It,normalize:Ft},rt=class extends B{constructor(){super(...arguments);this.spec=cr}};customElements.define("sunspots-card-editor",rt);function mr(t,e=307200){return typeof t!="string"||t.length===0?{ok:!1,reason:"invalid"}:t.length>e?{ok:!1,reason:"too_large"}:t.length*3>e&&new TextEncoder().encode(t).length>e?{ok:!1,reason:"too_large"}:{ok:!0,svg:t}}function mn(t){return typeof t=="number"&&Number.isFinite(t)?t:void 0}function pn(t,e){let r=t?.response?.[e];if(typeof r!="object"||r===null)return{ok:!1,reason:"invalid"};let i=r,o=mr(i.svg);return o.ok?{ok:!0,map:{svg:o.svg,time:typeof i.time=="string"?i.time:void 0,sunAzimuth:mn(i.sun_azimuth),sunElevation:mn(i.sun_elevation),sunBelowHorizon:i.sun_below_horizon===!0}}:o}function hn(t,e,n){return{type:"call_service",domain:"sunspots",service:"render_shadow_map",service_data:e===void 0?{theme:n}:{time:e,theme:n},target:{entity_id:t},return_response:!0}}function fn(t){if(typeof t=="string")return t;if(typeof t=="object"&&t!==null&&"message"in t){let e=t.message;if(typeof e=="string"&&e!=="")return e}return"unknown error"}var ye=class extends Error{constructor(n){super(n);this.reason=n}},W=class{constructor(e,n){this.getHass=e;this.onChange=n;this.current={status:"idle"}}get state(){return this.current}request(e){let n=this.current;this.setState(n.status==="ready"||n.status==="loading"?{status:"loading",...n.url?{url:n.url}:{},...n.map?{map:n.map}:{}}:{status:"loading"}),this.runner??=new oe(r=>this.fetch(r),r=>this.settled(r)),this.runner.request(e)}reset(){this.runner?.dispose(),this.runner=void 0,this.revoke(),this.setState({status:"idle"})}setState(e){this.current=e,this.onChange(e)}revoke(){this.objectUrl&&URL.revokeObjectURL(this.objectUrl),this.objectUrl=void 0}async fetch(e){let n=this.getHass();if(!n)throw new Error("not ready");let r=await n.connection.sendMessagePromise(hn(e.entityId,e.isoTime,e.theme)),i=pn(r,e.entityId);if(!i.ok)throw new ye(i.reason);return i.map}settled(e){if(this.revoke(),!e.ok){let n=this.getHass(),r=n?E(n):void 0,i=e.error,o=i instanceof ye?h(r,i.reason==="too_large"?"map_too_large":"map_invalid"):h(r,"map_error",{message:fn(i)});this.setState({status:"error",message:o});return}this.objectUrl=URL.createObjectURL(new Blob([e.value.svg],{type:"image/svg+xml"})),this.setState({status:"ready",url:this.objectUrl,map:e.value})}};function gn(t){return(e,n)=>h(t,e,n)}function be(t,e,n,r,i){let o=t.status==="ready"||t.status==="loading"?t.map:void 0;if(!o?.time)return A(i,r);let s=he(o.time,n.config.time_zone,e.dayStart);return s!==void 0?Ye(s,r):o.time}function we(t,e,n,r){let i=gn(r),o=t.status==="ready"||t.status==="loading"?t.url:void 0;return p`<div class="mapbox" aria-busy=${t.status==="loading"?"true":"false"}>
    ${o?p`<img src=${o} alt=${i("map_alt",{name:e.name,time:n})} />`:m}
    ${t.status==="loading"?p`<div class="overlay" role="status">${i("map_loading")}</div>`:m}
    ${t.status==="error"?p`<div class="error" role="alert">${t.message}</div>`:m}
  </div>`}function ve(t,e,n,r){let i=A(e,n);return p`<label class="slider">
    <span>${t.name} · <strong>${i}</strong></span>
    <input
      type="range"
      .min=${String(t.minMinute)}
      .max=${String(t.maxMinute)}
      .step=${String(t.step)}
      .value=${String(e)}
      aria-valuetext=${i}
      @input=${r}
    />
  </label>`}function Se(t,e,n,r){let i=gn(r),o=t.status==="ready"||t.status==="loading"?t.map:void 0;return p`${o?p`<div class="meta">
        <div>${i("map_time",{time:n})}</div>
        ${o.sunAzimuth!==void 0&&o.sunElevation!==void 0?p`<div>
              ${i("azimuth")}: ${Ve(o.sunAzimuth,r)} · ${i("elevation")}:
              ${Ve(o.sunElevation,r)}
            </div>`:m}
        ${o.sunBelowHorizon?p`<div>${i("map_sun_below")}</div>`:m}
      </div>`:m}
  ${e.attribution?p`<div class="attribution">${e.attribution}</div>`:m}`}var xe=M`
  .content {
    padding: 0 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    color: var(--primary-text-color);
  }
  .error {
    color: var(--error-color, #db4437);
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
`;function $e(t,e,n,r){customElements.define(t,e),window.customCards=window.customCards??[],window.customCards.push({type:t,name:h(navigator.language,n),description:h(navigator.language,r)})}function Y(t,e){return t==="auto"?e.themes?.darkMode===!0?"dark":"light":t}var pr=150,it=class extends v{constructor(){super();this.loader=new W(()=>this.hass,n=>{this._mapState=n});this.debouncer=se(()=>this.loadMap(),pr);this.dayStart=0;this._mapState={status:"idle"}}static{this.properties={hass:{attribute:!1},_config:{state:!0},_mapState:{state:!0},_minute:{state:!0}}}static getStubConfig(n,r){let i=le(n,r);return{type:"custom:sunspots-card",mode:"overview",entities:i?[i]:[]}}static getConfigElement(){return document.createElement("sunspots-card-editor")}setConfig(n){this._config=Mt(n),this.resetMap()}getCardSize(){let n=this._config;return n?n.mode==="map"?8:n.mode==="timeline"?1+n.entities.length*(1+me(n.showToday,n.showTomorrow).length*2):1+n.entities.length:1}getGridOptions(){return{columns:12,min_columns:6,rows:"auto"}}disconnectedCallback(){super.disconnectedCallback(),this.resetMap()}updated(){let n=this._config,r=this.hass,i=n?.entities[0];if(!r||n?.mode!=="map"||!i)return;let o=`${i}|${Y("auto",r)}`;if(this.mapKey===o)return;let s=this.currentModel();s?.mode==="map"&&!s.map.error&&(this.mapKey=o,this.mapEntity=i,this.dayStart=s.map.dayStart,this._minute??=s.map.initialMinute,this.loadMap())}currentModel(){return this.hass&&this._config?nt(this.hass,this._config,new Date):void 0}loadMap(){let n=this.hass,r=this.mapEntity;!n||!r||this._minute===void 0||this.loader.request({entityId:r,isoTime:fe(this._minute,this.dayStart),theme:Y("auto",n)})}resetMap(){this.debouncer.cancel(),this.loader.reset(),this.mapKey=void 0,this.mapEntity=void 0,this._minute=void 0}onSlide(n){this._minute=Number(n.target.value),this.debouncer.call()}render(){if(!this._config||!this.hass)return p`<ha-card></ha-card>`;let n=nt(this.hass,this._config,new Date),r=E(this.hass);return p`<ha-card .header=${n.title}>
      <div class="content">
        ${n.mode==="overview"?n.rows.map(i=>this.renderOverviewRow(i)):n.mode==="timeline"?this.renderTimeline(n.rows):this.renderMap(n.map,this.hass,r)}
      </div>
    </ha-card>`}renderOverviewRow(n){if(n.error)return p`<div class="row error">${n.error}</div>`;let r=[n.boundary,n.forecastNote,...n.extras].filter(i=>!!i);return p`<div class="row">
      <div class="name">${n.name}</div>
      <div class="chip ${n.status}">
        <ha-icon icon=${n.icon}></ha-icon><span>${n.statusLabel}</span>
      </div>
      ${r.length>0?p`<div class="details">${r.join(" · ")}</div>`:m}
    </div>`}renderTimeline(n){return n.map(r=>r.error?p`<div class="row error">${r.error}</div>`:p`<div class="timeline">
        <div class="head">
          <div class="name">${r.name}</div>
          <div class="chip ${r.status}">
            <ha-icon icon=${r.icon}></ha-icon><span>${r.statusLabel}</span>
          </div>
        </div>
        ${r.days.map(i=>this.renderDay(r,i))}
        <ul class="legend">
          ${r.legend.map(i=>p`<li><span class="swatch seg ${i.kind==="geometry"?"sunny":i.kind}"></span>${i.label}</li>`)}
        </ul>
      </div>`)}renderDay(n,r){return p`<div class="day ${r.key}">
      <div class="daylabel">${r.label}</div>
      <div class="daybody">
        <div class="barwrap">
          <div class="bar" role="img" aria-label=${r.ariaLabel}>
            ${n.ticks.map(i=>p`<div class="grid" style="left:${i.percent}%"></div>`)}
            ${r.bars.map(i=>p`<div
                class="seg ${i.kind} ${i.past?"past":""}"
                style="left:${i.left}%;width:${i.width}%"
              >
                ${i.label?p`<span class="seglabel">${i.label}</span>`:m}
              </div>`)}
          </div>
          ${r.nowPercent!==void 0?p`<div class="now" style="left:${r.nowPercent}%"></div>
                <div class="nowlabel" style="left:${r.nowPercent}%" aria-hidden="true">${n.nowLabel}</div>`:m}
        </div>
        <div class="ticks" aria-hidden="true">
          ${n.ticks.map(i=>i.label?p`<span style="left:${i.percent}%">${i.label}</span>`:m)}
        </div>
        <div class="summary">${r.summary}</div>
      </div>
    </div>`}renderMap(n,r,i){if(n.error)return p`<div class="row error">${n.error}</div>`;let o=this._mapState,s=this._minute??n.initialMinute,a=be(o,n,r,i,s);return p`${we(o,n,a,i)}
    ${ve(n,s,i,d=>this.onSlide(d))}
    ${Se(o,n,a,i)}`}static{this.styles=[xe,M`
      :host {
        --sunspots-sun: var(--amber-color, var(--warning-color, #f5a623));
        --sunspots-on-sun: #1c1c1c;
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
      .timeline {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 4px 12px;
      }
      .head .name {
        font-weight: 500;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .day {
        display: grid;
        grid-template-columns: 4.5em minmax(0, 1fr);
        column-gap: 8px;
      }
      .day.today {
        padding-top: 16px;
      }
      .daylabel {
        line-height: 28px;
        font-size: 0.9em;
        font-weight: 500;
      }
      .barwrap {
        position: relative;
      }
      .bar {
        position: relative;
        height: 28px;
        border-radius: 4px;
        border: 1px solid var(--divider-color);
        background: var(--secondary-background-color, transparent);
        overflow: hidden;
      }
      .grid {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 1px;
        background: var(--divider-color);
        opacity: 0.6;
      }
      .seg {
        position: absolute;
        top: 0;
        bottom: 0;
      }
      .seg.sunny {
        background: var(--sunspots-sun);
        color: var(--sunspots-on-sun);
      }
      .seg.partly {
        background: repeating-linear-gradient(45deg, var(--sunspots-sun) 0 4px, transparent 4px 8px);
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
      .seglabel {
        display: block;
        padding: 0 4px;
        line-height: 28px;
        font-size: 0.8em;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .now {
        position: absolute;
        top: -4px;
        bottom: -4px;
        width: 3px;
        margin-left: -1.5px;
        border-radius: 2px;
        background: var(--primary-text-color);
        box-shadow: 0 0 0 1px var(--card-background-color, transparent);
      }
      .nowlabel {
        position: absolute;
        bottom: calc(100% + 4px);
        transform: translateX(-50%);
        font-size: 0.75em;
        font-weight: 600;
        line-height: 1;
        color: var(--primary-text-color);
      }
      .ticks {
        position: relative;
        height: 1.2em;
        margin-top: 2px;
        font-size: 0.7em;
        color: var(--secondary-text-color);
      }
      .ticks span {
        position: absolute;
        transform: translateX(-50%);
        white-space: nowrap;
      }
      .summary {
        font-size: 0.85em;
        color: var(--secondary-text-color);
      }
      .legend {
        list-style: none;
        margin: 0;
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
    `]}};$e("sunspots-card",it,"card_name","card_description");var hr={schema:Dt,hourScope:()=>"slider",formData:Kt,normalize:zt},ot=class extends B{constructor(){super(...arguments);this.spec=hr}};customElements.define("sunspots-shadow-card-editor",ot);var fr=150,st=class extends v{constructor(){super();this.loader=new W(()=>this.hass,n=>{this._mapState=n});this.debouncer=se(()=>this.load(),fr);this._mapState={status:"idle"}}static{this.properties={hass:{attribute:!1},_config:{state:!0},_mapState:{state:!0},_minute:{state:!0}}}static getStubConfig(n,r){return{type:"custom:sunspots-shadow-card",entity:le(n,r)??""}}static getConfigElement(){return document.createElement("sunspots-shadow-card-editor")}setConfig(n){this._config=kt(n),this.stop(),this.loader.reset(),this._minute=void 0,this.loadedKey=void 0,this.isConnected&&this.arm()}getCardSize(){return this._config?.showSlider?8:6}getGridOptions(){return{columns:12,min_columns:6,rows:"auto"}}connectedCallback(){super.connectedCallback(),this.arm(),this.requestUpdate()}disconnectedCallback(){super.disconnectedCallback(),this.stop(),this.loader.reset(),this.loadedKey=void 0}updated(){let n=this._config,r=this.hass;if(!n||!r||!this.isConnected)return;let i=`${n.entity}|${Y(n.theme,r)}`;if(this.loadedKey===i)return;let{map:o}=_e(r,n,new Date);o.error||(this.loadedKey=i,this.load())}arm(){this.stop();let n=this._config?.refreshMinutes;n!==void 0&&(this.timer=setInterval(()=>this.load(),n*6e4))}stop(){this.debouncer.cancel(),this.timer!==void 0&&clearInterval(this.timer),this.timer=void 0}load(){let n=this._config,r=this.hass;if(!n||!r)return;let{dayStart:i}=_e(r,n,new Date).map;this.loader.request({entityId:n.entity,isoTime:this._minute===void 0?void 0:fe(this._minute,i),theme:Y(n.theme,r)})}onRefresh(){this._minute=void 0,this.load()}onSlide(n){this._minute=Number(n.target.value),this.debouncer.call()}render(){let n=this._config,r=this.hass;if(!n||!r)return p`<ha-card></ha-card>`;let{title:i,map:o}=_e(r,n,new Date),s=E(r);if(o.error)return p`<ha-card .header=${i}><div class="content error">${o.error}</div></ha-card>`;let a=this._mapState,d=this._minute??o.initialMinute,u=be(a,o,r,s,d);return p`<ha-card .header=${i}>
      <div class="content">
        ${we(a,o,u,s)}
        ${n.showSlider?ve(o,d,s,c=>this.onSlide(c)):m}
        <div class="footer">
          <div class="caption">${Se(a,o,u,s)}</div>
          <button
            class="refresh"
            type="button"
            title=${h(s,"refresh")}
            aria-label=${h(s,"refresh")}
            @click=${()=>this.onRefresh()}
          >
            <ha-icon icon="mdi:refresh"></ha-icon>
          </button>
        </div>
      </div>
    </ha-card>`}static{this.styles=[xe,M`
      .footer {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
      }
      .caption {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }
      .refresh {
        flex: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--secondary-text-color);
        cursor: pointer;
      }
      .refresh:hover,
      .refresh:focus-visible {
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
      }
    `]}};$e("sunspots-shadow-card",st,"shadow_card_name","shadow_card_description");
