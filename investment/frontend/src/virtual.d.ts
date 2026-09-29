declare module 'virtual:project-tree' {
  interface TreeNode {
    name: string
    type: 'file' | 'directory'
    children?: TreeNode[]
  }
  const tree: TreeNode[]
  export default tree
}
