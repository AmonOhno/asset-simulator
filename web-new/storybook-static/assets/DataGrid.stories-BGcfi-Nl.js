import{n as e}from"./chunk-DnJy8xQt.js";import{t}from"./jsx-runtime-CXZ2plg1.js";function n({data:e,columns:t,colorVariant:n=`gray`}){let o=i[n];return(0,r.jsx)(`div`,{style:a.wrapper,children:(0,r.jsxs)(`table`,{style:a.table,children:[(0,r.jsx)(`thead`,{children:(0,r.jsx)(`tr`,{children:t.map(e=>(0,r.jsx)(`th`,{style:{...a.th,...o,textAlign:e.align??`left`,...e.width==null?{}:{width:e.width}},children:e.label},e.key))})}),(0,r.jsx)(`tbody`,{children:e.map((e,n)=>(0,r.jsx)(`tr`,{children:t.map(t=>(0,r.jsx)(`td`,{style:{...a.td,textAlign:t.align??`left`},children:String(e[t.key]??``)},t.key))},n))})]})})}var r,i,a,o=e((()=>{r=t(),i={blue:{backgroundColor:`#EEF2FF`,color:`#4F46E5`},red:{backgroundColor:`#FEF2F2`,color:`#DC2626`},gray:{backgroundColor:`#F3F4F6`,color:`#374151`}},a={wrapper:{overflowX:`auto`,width:`100%`,boxSizing:`border-box`},table:{width:`100%`,borderCollapse:`collapse`,fontSize:13},th:{height:40,padding:`0 8px`,fontWeight:600,whiteSpace:`nowrap`,textAlign:`left`,borderBottom:`1px solid #E5E7EB`},td:{height:40,padding:`0 8px`,whiteSpace:`nowrap`,borderBottom:`1px solid #F3F4F6`}},n.__docgenInfo={description:``,methods:[],displayName:`DataGrid`,props:{data:{required:!0,tsType:{name:`Array`,elements:[{name:`T`}],raw:`T[]`},description:``},columns:{required:!0,tsType:{name:`Array`,elements:[{name:`ColumnConfig`,elements:[{name:`T`}],raw:`ColumnConfig<T>`}],raw:`ColumnConfig<T>[]`},description:``},colorVariant:{required:!1,tsType:{name:`union`,raw:`"blue" | "red" | "gray"`,elements:[{name:`literal`,value:`"blue"`},{name:`literal`,value:`"red"`},{name:`literal`,value:`"gray"`}]},description:``,defaultValue:{value:`"gray"`,computed:!1}}}}}));function s(e){return(0,c.jsx)(n,{...e})}var c,l,u,d,f,p,m,h;e((()=>{o(),c=t(),l=[{year:`2025`,principal:`1,000,000`,interest:`30,000`,total:`1,030,000`},{year:`2026`,principal:`1,030,000`,interest:`30,900`,total:`1,060,900`},{year:`2027`,principal:`1,060,900`,interest:`31,827`,total:`1,092,727`},{year:`2028`,principal:`1,092,727`,interest:`32,782`,total:`1,125,509`},{year:`2029`,principal:`1,125,509`,interest:`33,765`,total:`1,159,274`}],u=[{label:`年度`,key:`year`,width:60,align:`center`},{label:`元本`,key:`principal`,width:120,align:`right`},{label:`利息`,key:`interest`,width:100,align:`right`},{label:`合計`,key:`total`,width:120,align:`right`}],d={title:`Components/DataGrid`,component:s,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{colorVariant:{control:`select`,options:[`blue`,`red`,`gray`]}}},f={args:{data:l,columns:u,colorVariant:`blue`}},p={args:{data:l,columns:u,colorVariant:`red`}},m={args:{data:l,columns:u,colorVariant:`gray`}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    data: sampleData,
    columns,
    colorVariant: "blue"
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    data: sampleData,
    columns,
    colorVariant: "red"
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    data: sampleData,
    columns,
    colorVariant: "gray"
  }
}`,...m.parameters?.docs?.source}}},h=[`Blue`,`Red`,`Gray`]}))();export{f as Blue,m as Gray,p as Red,h as __namedExportsOrder,d as default};