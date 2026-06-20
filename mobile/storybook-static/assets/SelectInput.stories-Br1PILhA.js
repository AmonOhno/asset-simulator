import{a as e,n as t}from"./chunk-DnJy8xQt.js";import{O as n}from"./iframe-C-OuKDg-.js";import{t as r}from"./jsx-runtime-CXZ2plg1.js";function i(){return(0,o.jsx)(`svg`,{style:c.icon,viewBox:`0 0 24 24`,fill:`none`,stroke:`#666`,strokeWidth:`2`,strokeLinecap:`round`,strokeLinejoin:`round`,"aria-hidden":`true`,children:(0,o.jsx)(`polyline`,{points:`6 9 12 15 18 9`})})}function a({options:e,value:t,onChange:n,sizeVariant:r=`Full`}){return(0,o.jsxs)(`div`,{style:{...c.wrapper,width:s[r]},children:[(0,o.jsx)(`select`,{value:t,onChange:e=>n(e.target.value),style:c.select,children:e.map(e=>(0,o.jsx)(`option`,{value:e.value,children:e.label},e.value))}),(0,o.jsx)(i,{})]})}var o,s,c,l=t((()=>{o=r(),s={S:`140px`,M:`160px`,L:`240px`,Full:`100%`},c={wrapper:{position:`relative`,width:`100%`},select:{height:44,fontSize:16,padding:`0 36px 0 12px`,borderRadius:8,border:`1px solid #D1D5DB`,boxSizing:`border-box`,width:`100%`,color:`#333`,backgroundColor:`#FFFFFF`,appearance:`none`,cursor:`pointer`},icon:{position:`absolute`,right:12,top:`50%`,transform:`translateY(-50%)`,pointerEvents:`none`,width:16,height:16}},a.__docgenInfo={description:``,methods:[],displayName:`SelectInput`,props:{options:{required:!0,tsType:{name:`Array`,elements:[{name:`SelectOption`}],raw:`SelectOption[]`},description:``},value:{required:!0,tsType:{name:`union`,raw:`string | number`,elements:[{name:`string`},{name:`number`}]},description:``},onChange:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(value: string) => void`,signature:{arguments:[{type:{name:`string`},name:`value`}],return:{name:`void`}}},description:``},sizeVariant:{required:!1,tsType:{name:`union`,raw:`"S" | "M" | "L" | "Full"`,elements:[{name:`literal`,value:`"S"`},{name:`literal`,value:`"M"`},{name:`literal`,value:`"L"`},{name:`literal`,value:`"Full"`}]},description:``,defaultValue:{value:`"Full"`,computed:!1}}}}})),u,d,f,p,m,h,g,_,v,y;t((()=>{u=e(n(),1),l(),d=r(),f=[{label:`積立投資`,value:`tsumitate`},{label:`一括投資`,value:`lump_sum`},{label:`分散投資`,value:`diversified`}],p={title:`Components/SelectInput`,component:a,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{sizeVariant:{control:`select`,options:[`S`,`M`,`L`,`Full`]}}},m={args:{options:f,value:`tsumitate`,onChange:()=>{},sizeVariant:`Full`},render:function(e){let[t,n]=(0,u.useState)(e.value);return(0,d.jsx)(`div`,{style:{width:280},children:(0,d.jsx)(a,{...e,value:t,onChange:n})})}},h={args:{options:f,value:`tsumitate`,onChange:()=>{},sizeVariant:`S`},render:function(e){let[t,n]=(0,u.useState)(e.value);return(0,d.jsx)(a,{...e,value:t,onChange:n})}},g={args:{options:f,value:`lump_sum`,onChange:()=>{},sizeVariant:`M`},render:function(e){let[t,n]=(0,u.useState)(e.value);return(0,d.jsx)(a,{...e,value:t,onChange:n})}},_={args:{options:f,value:`diversified`,onChange:()=>{},sizeVariant:`L`},render:function(e){let[t,n]=(0,u.useState)(e.value);return(0,d.jsx)(a,{...e,value:t,onChange:n})}},v={args:{options:[{label:`毎月`,value:1},{label:`毎週`,value:2},{label:`毎日`,value:3}],value:1,onChange:()=>{}},render:function(e){let[t,n]=(0,u.useState)(String(e.value));return(0,d.jsx)(`div`,{style:{width:280},children:(0,d.jsx)(a,{...e,value:t,onChange:n})})}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    options: planOptions,
    value: "tsumitate",
    onChange: () => {},
    sizeVariant: "Full"
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <div style={{
      width: 280
    }}>
        <SelectInput {...args} value={value} onChange={setValue} />
      </div>;
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    options: planOptions,
    value: "tsumitate",
    onChange: () => {},
    sizeVariant: "S"
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <SelectInput {...args} value={value} onChange={setValue} />;
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    options: planOptions,
    value: "lump_sum",
    onChange: () => {},
    sizeVariant: "M"
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <SelectInput {...args} value={value} onChange={setValue} />;
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    options: planOptions,
    value: "diversified",
    onChange: () => {},
    sizeVariant: "L"
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <SelectInput {...args} value={value} onChange={setValue} />;
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    options: [{
      label: "毎月",
      value: 1
    }, {
      label: "毎週",
      value: 2
    }, {
      label: "毎日",
      value: 3
    }],
    value: 1,
    onChange: () => {}
  },
  render: function Render(args) {
    const [value, setValue] = useState(String(args.value));
    return <div style={{
      width: 280
    }}>
        <SelectInput {...args} value={value} onChange={setValue} />
      </div>;
  }
}`,...v.parameters?.docs?.source}}},y=[`Default`,`SizeSmall`,`SizeMedium`,`SizeLarge`,`NumericValues`]}))();export{m as Default,v as NumericValues,_ as SizeLarge,g as SizeMedium,h as SizeSmall,y as __namedExportsOrder,p as default};