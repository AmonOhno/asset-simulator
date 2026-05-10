import{a as e,n as t}from"./chunk-DnJy8xQt.js";import{O as n}from"./iframe-C-OuKDg-.js";import{t as r}from"./jsx-runtime-CXZ2plg1.js";function i({placeholder:e,sizeVariant:t=`Full`,value:n,onBlur:r,onChange:i}){return(0,a.jsx)(`input`,{type:`text`,placeholder:e,value:n,onChange:e=>i?.(e.target.value),onBlur:r,style:{...s.input,width:o[t]},className:`text-input`})}var a,o,s,c=t((()=>{a=r(),o={S:`120px`,M:`160px`,L:`240px`,Full:`100%`},s={input:{height:44,fontSize:16,padding:`0 12px`,borderRadius:8,border:`1px solid #D1D5DB`,boxSizing:`border-box`,color:`#333`,backgroundColor:`#FFFFFF`},placeholder:{color:`#888`}},i.__docgenInfo={description:``,methods:[],displayName:`TextInput`,props:{placeholder:{required:!0,tsType:{name:`string`},description:``},sizeVariant:{required:!1,tsType:{name:`union`,raw:`"S" | "M" | "L" | "Full"`,elements:[{name:`literal`,value:`"S"`},{name:`literal`,value:`"M"`},{name:`literal`,value:`"L"`},{name:`literal`,value:`"Full"`}]},description:``,defaultValue:{value:`"Full"`,computed:!1}},value:{required:!0,tsType:{name:`string`},description:``},onBlur:{required:!1,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},onChange:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(value: string) => void`,signature:{arguments:[{type:{name:`string`},name:`value`}],return:{name:`void`}}},description:``}}}})),l,u,d,f,p,m,h,g;t((()=>{l=e(n(),1),c(),u=r(),d={title:`Components/TextInput`,component:i,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{sizeVariant:{control:`select`,options:[`S`,`M`,`L`,`Full`]}}},f={args:{placeholder:`Enter text here`,value:``,sizeVariant:`Full`},render:function(e){let[t,n]=(0,l.useState)(e.value);return(0,u.jsx)(`div`,{style:{width:320},children:(0,u.jsx)(i,{...e,value:t,onChange:n})})}},p={args:{placeholder:`Small input`,value:``,sizeVariant:`S`},render:function(e){let[t,n]=(0,l.useState)(e.value);return(0,u.jsx)(`div`,{style:{width:320},children:(0,u.jsx)(i,{...e,value:t,onChange:n})})}},m={args:{placeholder:`Medium input`,value:``,sizeVariant:`M`},render:function(e){let[t,n]=(0,l.useState)(e.value);return(0,u.jsx)(`div`,{style:{width:320},children:(0,u.jsx)(i,{...e,value:t,onChange:n})})}},h={args:{placeholder:`Large input`,value:``,sizeVariant:`L`},render:function(e){let[t,n]=(0,l.useState)(e.value);return(0,u.jsx)(`div`,{style:{width:320},children:(0,u.jsx)(i,{...e,value:t,onChange:n})})}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: "Enter text here",
    value: "",
    sizeVariant: "Full"
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <div style={{
      width: 320
    }}>
        <TextInput {...args} value={value} onChange={setValue} />
      </div>;
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: "Small input",
    value: "",
    sizeVariant: "S"
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <div style={{
      width: 320
    }}>
        <TextInput {...args} value={value} onChange={setValue} />
      </div>;
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: "Medium input",
    value: "",
    sizeVariant: "M"
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <div style={{
      width: 320
    }}>
        <TextInput {...args} value={value} onChange={setValue} />
      </div>;
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: "Large input",
    value: "",
    sizeVariant: "L"
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <div style={{
      width: 320
    }}>
        <TextInput {...args} value={value} onChange={setValue} />
      </div>;
  }
}`,...h.parameters?.docs?.source}}},g=[`Default`,`Small`,`Medium`,`Large`]}))();export{f as Default,h as Large,m as Medium,p as Small,g as __namedExportsOrder,d as default};