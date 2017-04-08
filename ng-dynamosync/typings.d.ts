/// &lt;reference path="index.ts" /&gt;
declare module 'NgDynamoSync' {
    // Put this if there is a default export in your module
    import defaultExport from 'index';
    export default defaultExport;
 
   // Put this if there are named exports in your module
   export * from 'index';
}