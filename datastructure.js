/*
I was asked to choose any data structure to store the information. i chose a b+ tree for performance
My reasons are as follows. b+ trees are specially optimized for performance, i was thinking
of cases where i would be processing millions of rows in the csv, then it might not be as efficient to use a simple array.

In this case its nearly as fast as sql processing if i wanted to search for say employees employed at this time
or employees in this salary range. i dont have to search for every single element like an array but my b+ tree can do this at lightning speeds 

B+ trees are also not like arrays which take up a continous space of memory. and do not grow dynamically.
also the arrays arent going to be sorted automatically making it that when we want to find id of 50, we mgith have to search every element
but in my tree the arrays are sorted automatically by our kind of directory at the top, and time complexity is lower.

if i wanted to search by name, i would optimize it with a different tree, but here is optimized from id
*/

class BPlusTreeNode {
    constructor(m) { // constructor or just an instance of a node.
      this.isLeaf = true; 
      this.keys = [];
      this.pointers = []; // where the pointers to more information is stored.
      //this.size = 0;
      this.m = m;
      this.nextNode = null;
      this.parent = null;
      this.records = []; // where the actual data is stored
    }
  
    isFull() {
      return this.keys.length === this.m;// checks if number of keys we can hold is full
    }
  
    insert(key, value) { // insert key value pair into the node.
      if (this.isFull()) {
        return this.split(key); //this is how we handle overflow.
      } else {
        let index = this.orderedInsert(this.keys, key); // else just insert it like this in an ordered manner.
        this.insertRecord(value, index);
        return [null, null];
      }
    }
  
    insertRecord(record, insertIndex) {
      if (this.isLeaf) { // insert record into the leafnode at specified index. but only execute if this is a leaf
        const r = this.records;
        for(let i = r.length; i > insertIndex; --i) {
          r[i] = r[i - 1]; //shifts everything to the right to make space for new record
        }
        r[insertIndex] = record;
      }
    }
  
    hasParent() { // is there a node above this method
      return this.parent != undefined;
    }
  
    split(newKey) {  //when the node is full we can split it full simply means it has reached its maximum capacity for storing pointers
                      //so we must split to let the b+ tree be efficient
      let insertIndex = this.orderedInsert(this.keys, newKey);
      let newRootKey = this.keys[Math.floor(this.keys.length/2)]; // decides where to split the key
      if (this.isLeaf) { // splits leaf into two part
        let splitKeys = this.keys.splice(this.keys.length / 2, this.keys.length - 1);
        return [newRootKey, splitKeys, insertIndex];
      } else { //non leaf split accorindgly
        let splitIndex = Math.floor(this.keys.length/2)+1;
        let splitKeys = this.keys.splice(splitIndex, this.keys.length - 1);
        this.keys.pop();
        return [newRootKey, splitKeys, splitIndex];
      }
    }
  
    orderedInsert(arr, item) { // insert an item into an array while maintaining order
      let low = 0;
      let high = arr.length;
      while (low < high) { //binary search.
        let mid = (low + high) >>> 1;
        if (arr[mid] < item) low = mid + 1;
        else high = mid;
      }
      arr.splice(low, 0, item);
      return low;
    }
  }
  
  class BPlusTree {
    constructor(m, root) { //initialize constructor here
        this.root = root;
        this.m = m;
    }
  
    insert(id, name, email, position, salary) {
      const record = {ID: id, Name: name, Email: email, Position: position, Salary: salary}; //insertion
      
      if (!this.root) {
        this.root = new BPlusTreeNode(this.order); // basic binary tree logic. if tree is empty,then make this the root node or else
        this.root.insert(id, record);
      } else { // or else move on to this
        let [n, idx] = this.findLeafNode(id, this.root); // find the leaf node where we will insert.
        if (n.isFull()) { // if we fine a full leaf node, we just have to split the node.
          let newRecords = n.records.splice(n.records.length / 2, n.records.length - 1);
          let [newRootKey, splitKeys] = n.insert(id, record);
          let newNode = new BPlusTreeNode(this.order);
          newNode.keys = splitKeys;
          newNode.parent = n.parent;
          newNode.records = newRecords;
          newNode.insertRecord(record, newNode.keys.indexOf(id));
          newNode.nextNode = n.nextNode;
          n.nextNode = newNode;
          if (n.parent) { // if it has a parent update the parents pointer to include the new node.
            n.parent.pointers.splice(idx+1, 0, newNode);
          }
          this.parentInsert(newRootKey, n, newNode);
        } else {
          n.insert(id, record);
        }
      }
    }
  // a lot of helper methods here that make the insert work
    parentInsert(key, leftNode, rightNode) {
      let parent = leftNode.parent; // let parent be the left node parent
      if (parent) { // if there is a parent
        if (parent.isFull()) { // if parent is full
          let [newRootKey, splitKeys, splitIndex] = parent.insert(key); // parent node is split to accomodate our new key
          let internalNode = new BPlusTreeNode(this.order);
          internalNode.keys = splitKeys; // assign the keys to the new node that were split off from the parent
          internalNode.pointers = parent.pointers.splice(splitIndex, parent.pointers.length - 1); //pointers that correspond to the split keys are moved to the new internal node
          internalNode.pointers[0].parent = internalNode; // sets the parent of the first child pointer of the internal node to itself
          internalNode.isLeaf = false; //not a leaf so be false
          internalNode.pointers.push(rightNode); //node created during the split
  
          rightNode.parent = internalNode;
          parent.isLeaf = false;
          if (parent.hasParent()) {
            return this.parentInsert(newRootKey, parent, internalNode); //propagates the split to the parents parent
          } else {
            this.makeRootNode(newRootKey, parent, internalNode);
          }
        } else {
          rightNode.parent = parent;
          parent.insert(key);
        }
      } else {
        this.makeRootNode(key, leftNode, rightNode);
      }
    }
  
    makeRootNode(key, leftPointer, rightPointer) { //function to make root node
      let rn = new BPlusTreeNode(this.order);
      rn.isLeaf = false;
      rn.insert(key);
      rn.pointers.push(leftPointer, rightPointer);
      leftPointer.parent = rn;
      rightPointer.parent = rn;
      this.root = rn;
    }
  
    findLeafNode(id, node, idx=-1) { //find leaf node for insertion, we can only insert in leaf nodes
        if (!node) {
            console.error('Node is undefined');
            return [null, -1];
        }
        if (node.isLeaf) {
            return [node, idx];
      } else {
        let [foundIndex, pointerIndex] = this.binarySearch(node.keys, id); //binary search method to find wha we are looking for. helpful for the finding
        if (pointerIndex !== null) {
          return this.findLeafNode(id, node.pointers[pointerIndex], pointerIndex);
        }
        if (foundIndex !== null) {
          return this.findLeafNode(id, node.pointers[foundIndex+1], foundIndex+1);
        }
      }
    }
  
    binarySearch(arr, target) {
      let left = 0;
      let right = arr.length - 1;
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) return [mid, mid];
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
      }
      return [null, left];
    }
  
    search(id) { //retrieve function for the api works like this
      let [leafNode] = this.findLeafNode(id, this.root);
      while (leafNode) {
        for (let i = 0; i < leafNode.keys.length; i++) {
          if (leafNode.keys[i] === id) {
            return leafNode.records[i];
          }
        }
        leafNode = leafNode.nextNode;
      }
      return null;
    }
    getAllRecords() { //retrieve function for the api also works here
        const records = [];
        if (!this.root) {
          return records; // Return an empty array if the tree is empty
        }
    
        // Start from the leftmost leaf node
        let currentNode = this.findLeftmostLeaf(this.root);
        while (currentNode) {
          // Collect all records from the current leaf node
          records.push(...currentNode.records);
          // Move to the next leaf node
          currentNode = currentNode.nextNode;
        }
        return records;
      }
    
      // Helper function to find the leftmost leaf node
      findLeftmostLeaf(node) {
        while (node && !node.isLeaf) {
          node = node.pointers[0]; // Keep going down to the leftmost pointer
        }
        return node; // Return the leftmost leaf node
      }

      update(id, updatedFields) {
        // Find the leaf node containing the record
        let [leafNode] = this.findLeafNode(id, this.root);

        // Check if the record exists in the found leaf node
        if (leafNode) {
            for (let i = 0; i < leafNode.keys.length; i++) {
                if (leafNode.keys[i] === id) {
                    // Update the fields that have been provided
                    let record = leafNode.records[i];

                    // Update only the fields that are in updatedFields 
                    record.Name = updatedFields.Name || record.Name;
                    record.Email = updatedFields.Email || record.Email;
                    record.Position = updatedFields.Position || record.Position;
                    record.Salary = updatedFields.Salary !== undefined ? updatedFields.Salary : record.Salary;

                    // Replace the old record with the updated one
                    leafNode.records[i] = record;

                    console.log(`Record with ID=${id} updated successfully`);
                    return true;
                }
            }
        }

        // If the record with the given ID is not found, return false or an appropriate error
        console.log(`Record not found`);
        return false;
    }
    delete(id) {
      // Find the leaf node where the ID is located
      let [leafNode] = this.findLeafNode(id, this.root);
    
      // If the leaf node is found, proceed with deletion
      if (leafNode) {
        for (let i = 0; i < leafNode.keys.length; i++) {
          if (leafNode.keys[i] === id) {
            // Remove the key and the corresponding record
            leafNode.keys.splice(i, 1);   // Remove the key
            leafNode.records.splice(i, 1); // Remove the record
            
            console.log(`Record with ID=${id} deleted successfully`);
            return true;
          }
        }
      }
    
      // If the record with the given ID is not found, return false
      console.log(`Record with ID=${id} not found`);
      return false;
    }
    
  }
  
  const myTree = new BPlusTree();
  
  export { myTree };