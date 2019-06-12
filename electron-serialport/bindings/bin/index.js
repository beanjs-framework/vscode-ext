var platform_str=process.platform;
var arch_str=process.arch;
var module_str=process.versions.modules;
var exp_module_str="v"+module_str;
exp_module_str+='-'+platform_str;
if(arch_str.indexOf('64')!=-1){
    exp_module_str+='-x64'
}else{
    exp_module_str+='-ia32'
}
exp_module_str+=".node";

//console.log(exp_module_str)

module.exports=require('./'+exp_module_str);

