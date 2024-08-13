class PriorityQueue {
    constructor() {
        this.heapArr = []
        this.counterDequeuedElements = 0
        this.prioritiesObj = {}
        this.references = new Set()
        this.deletedElements = new Set()
    }
    /**
     * ** 1b **
     * Push a new element in the queue with specified priority (higher priority comes out first).
     * When two inserted elements have the same priority, FIFO applies.
     * @param element {any}
     * @param priority {Number} can by any Number (even negative, float...).
     * @return {any} unique identifier of this element in the queue, used in other methods to reference this element
     * @throws {TypeError} when priority is not a Number
     */
    add(element, priority) {
        this.isNumber(priority)

        const newItem = {element, priority}

        this.heapArr.push(newItem)
        this.bubbleUp(this.heapArr.length - 1)

        this.increasePriority(priority)
        this.counterDequeuedElements++
        this.references.add(newItem)

        return newItem
    }

    /**
     * ** 0.5b **
     * Return the next prioritized element, but keep it in the queue
     * @return {any} queue element at the first position
     */
    get front() {
        return this.heapArr.length ? this.heapArr[0].element : null
    }

    /**
     * ** 0.5b **
     * Return the next prioritized element and dequeue it from the queue
     * @return {any} queue element at the first position
     */
    next() {
        if (!this.heapArr.length) {
            return null
        }

        // Pop the last element and remember the root
        const root = this.heapArr[0]
        this.heapArr[0] = this.heapArr.pop()

        // Bubble down new root
        if (this.heapArr.length) {
            this.bubbleDown(0)
        }

        // Decrease count of items which have the same priority
        this.decreasePriority(root.priority)
        this.references.delete(root)

        // Add to the deleted elements
        this.deletedElements.add(root)

        return root.element
    }

    /**
     * ** 0.5b **
     * @return {Number} **current** queue length
     */
    get length() {
        return this.heapArr.length
    }

    /**
     * ** 0.5b **
     * @return {Number} total amount of elements which have **ever been enqueued** in the queue
     */
    get totalProcessed() {
        return this.counterDequeuedElements
    }

    /**
     * ** 1b **
     * For given position in the queue, return object containing element's unique identifier
     *      (same identifier as previously returned from the `add` method) and also element's value
     * @param position {Number}
     * @return {?Object}
     * * {
     *     ref: {any}
     *     value: {any}
     * } when position contains an element
     * * `null` when position is higher than current queue length
     * @throws {TypeError} when `position` is not a Number
     * @throws {RangeError} when `position` is <= 0
     */
    at(position) {
        this.isNumber(position)

        if (position <= 0) {
            throw new RangeError("Position isn't from the interval")
        }
        if (position > this.heapArr.length) {
            return null
        }

        return {
            ref: this.heapArr[position - 1],
            value: this.heapArr[position - 1].element,
        }
    }

    /**
     * ** 1b **
     * Get current position of referenced element in the queue.
     * @param elementRef {any} Identifier obtained from the `add` method
     * @return {Number}
     * * `1` = first in line
     * * `length of queue` = last in line
     * * `-1` = referenced element is no longer in the queue
     * @throws {ReferenceError} when given reference have never existed (invalid reference)
     */
    positionOf(elementRef) {
        return this.getIndexByReference(elementRef) + 1
    }

    /**
     * ** 1b **
     * Change the priority of referenced element
     * @param elementRef {any} Identifier obtained from the `add` method
     * @param newPriority {Number}
     * @return {Number}
     * * <1, Inf] = new position in the queue
     * * -1 = referenced element is no longer in the queue
     * @throws {ReferenceError} when given reference have never existed (invalid reference)
     * @throws {TypeError} when `newPriority` is not a Number
     */
    changePriority(elementRef, newPriority) {
        this.isNumber(newPriority)

        if (!this.references.has(elementRef)) {
            throw new ReferenceError('Invalid reference')
        }

        let item = this.getValueByReference(elementRef)

        // Set new priority and in/decrease priority counters
        const oldPriority = item.priority
        this.decreasePriority(oldPriority)

        item.priority = newPriority
        this.increasePriority(newPriority)

        const index = this.heapArr.findIndex(item => item === elementRef)

        if (oldPriority > newPriority) {
            this.bubbleDown(index)
        } else if (oldPriority < newPriority) {
            this.bubbleUp(index)
        }

        return this.references.has(elementRef) ? this.heapArr.findIndex(item => item === elementRef) + 1 : -1
    }

    /**
     * ** 1b **
     * Remove referenced element from the queue, shifting elements at higher positions forward
     * @param elementRef
     * @return {Boolean}
     * * true when referenced element was present in the queue, and thus has been removed
     * * false when referenced  element has already been removed from the queue earlier (either by `removeByRef` or `next` method)
     * @throws {ReferenceError} when given reference have never existed (invalid reference)
     */
    removeByRef(elementRef) {
        if (this.deletedElements.has(elementRef)) {
            return false
        }

        let index = this.getIndexByReference(elementRef)

        // Delete item and decrease priority counter
        let item = this.heapArr.splice(index, 1)[0]
        this.decreasePriority(item.priority)
        this.deletedElements.add(item)

        return true
    }

    /**
     * ** 1b **
     * Remove element at given position, shifting elements at higher positions forward
     * @return {Boolean}
     * * true when position was occupied and so the element has been removed
     * * false when position is higher than current queue length
     * @param position
     * @throws {TypeError} when `position` is not a Number
     * @throws {RangeError} when `position` is <= 0
     */
    removeByPosition(position) {
        this.isNumber(position)

        if (position <= 0) {
            throw new RangeError("Position must be greater than 0")
        }
        if (position > this.length) {
            return false
        }

        const itemToRemove = this.heapArr[position - 1]
        this.removeByRef(itemToRemove)

        return true
    }

    /**
     * ** 0.5b **
     * Remove all elements from the queue
     */
    clear() {
        this.heapArr.length = 0
        this.references.clear()
        this.prioritiesObj = {}
        this.deletedElements.clear()
    }

    /**
     * ** 1.5b **
     * Similar to the Array.prototype.forEach, but iterate elements in prioritized queue order and instead of index,
     *      return their position. Does not return overall array of remaining elements
     * @param callbackfn {Function} A function that accepts up to two arguments: (value, position)
     * @param thisArg {Object} An object to which the `this` keyword can refer in the callbackfn function.
     *      If thisArg is omitted, undefined is used as the `this` value.
     * @throws {TypeError} when `callbackfn` is not a Function
     */
    forEach(callbackfn, thisArg = undefined) {
        if (typeof callbackfn !== 'function') {
            throw new TypeError(`${callbackfn} is not a function`)
        }

        const sortedPriorityArr = [...this.heapArr]
        sortedPriorityArr.sort((a, b) => b.priority - a.priority)

        for (let i = 0; i < sortedPriorityArr.length; i++) {
            callbackfn.call(thisArg, this.positionOf(sortedPriorityArr[i]), sortedPriorityArr[i].element)
        }
    }

    /**
     * ** 1b **
     * Provide statistics of current queue usage: return Object of **currently** used priorities and amount of items with each priority
     * @return {Object}
     * {
     *     priority: amount_of_elements_with_this_priority,
     *     another_priority: amount_of_elements_with_this_priority
     * }
     */
    get stats() {
        return this.prioritiesObj
    }

    bubbleUp (index) {
        let newElement = this.heapArr[index]

        while (index) {
            const parentIndex = Math.floor((index - 1) / 2)
            const parentElem = this.heapArr[parentIndex]

            if (parentElem.priority >= newElement.priority) {
                break
            }

            this.heapArr[parentIndex] = newElement
            this.heapArr[index] = parentElem
            index = parentIndex
        }
    }
    bubbleDown(index) {
        const actualElement = this.heapArr[index]
        while (true) {
            const leftChildIndex = 2 * index + 1
            const rightChildIndex = 2 * index + 2
            let ourPriorityIndex = index

            if (leftChildIndex < this.heapArr.length && this.heapArr[leftChildIndex].priority > this.heapArr[ourPriorityIndex].priority) {
                ourPriorityIndex = leftChildIndex
            }

            if (rightChildIndex < this.heapArr.length && this.heapArr[rightChildIndex].priority > this.heapArr[ourPriorityIndex].priority) {
                ourPriorityIndex = rightChildIndex
            }

            if (ourPriorityIndex === index) {
                break
            }

            this.heapArr[index] = this.heapArr[ourPriorityIndex]
            this.heapArr[ourPriorityIndex] = actualElement
            index = ourPriorityIndex
        }
    }

    increasePriority(priority) {
        if (this.prioritiesObj[priority]) {
            this.prioritiesObj[priority]++
        } else {
            this.prioritiesObj[priority] = 1
        }
    }

    decreasePriority(priority) {
        if (this.prioritiesObj[priority] === 1) {
            delete this.prioritiesObj[priority]
        } else {
            this.prioritiesObj[priority]--
        }
    }

    getIndexByReference(elementRef) {
        for (let i = 0; i < this.heapArr.length; i++) {
            if (this.heapArr[i] === elementRef) {
                return i
            }
        }

        throw new ReferenceError("Invalid reference")
    }

    getValueByReference(elementRef) {
        for (const value of this.references) {
            if (value === elementRef) {
                return value
            }
        }
        return null
    }

    isNumber(num) {
        if (typeof num !== 'number' || !isFinite(num)) {
            throw new TypeError('Priority must be a number')
        }
    }

    printQueue() {
        console.log(this.heapArr)
    }
}


// Some example elements to be added in the priority queue
const el1 = 'I came here first!'
const el2 = 'But I have higher priority!'
const fnEl = () => 'I am function returning a string!'
const objEl = {
    a: 2,
    b: 1
}
const numEl = 7


/*
PriorityQueue example usage (covering only these this does not guarantee 100% points earned, refer to comments above
each method to cover all edge cases, return values and throw types.
 */
const pq = new PriorityQueue

console.assert(pq.length === 0, `pq.length === 0`)
const el1Ref = pq.add(el1, 1)
console.assert(pq.length === 1, `pq.length === 1`)

const el2Ref = pq.add(el2, 2)
console.assert(pq.front === el2, `pq.front === ${el2}`)
console.assert(pq.stats[2] === 1, `pq.stats[2] === 1`)

console.assert(pq.changePriority(el1Ref, 3) === 1, `pq.changePriority(el1Ref, 3) === 1`)
console.assert(pq.front === el1, `pq.front === ${el1}`)
console.assert(pq.next() === el1, `pq.next() === ${el1}`)
console.assert(pq.length === 1, `pq.length === 1`)

const fnElRef = pq.add(fnEl, 7)
const objElRef1 = pq.add(objEl, -12.123456789)
const objElRef2 = pq.add(objEl, -12.123456789)
const objElRef3 = pq.add(objEl, -12.123456789)

console.assert(pq.at(2).ref === el2Ref, `pq.at(2).ref === ${el2Ref}`)
console.assert(pq.at(2).value === el2, `pq.at(2).value === ${el2}`)
console.assert(pq.at(17) === null, `pq.at(17) === null`)
console.assert(pq.positionOf(objElRef3) === 5, `pq.positionOf(objElRef3) === 5`)
console.assert(pq.removeByRef(objElRef2) === true, `pq.removeByRef(objElRef2) === true`)
console.assert(pq.positionOf(objElRef3) === 4, `pq.positionOf(objElRef3) === 4`)
console.assert(pq.totalProcessed === 6, `pq.totalProcessed === 6`)
console.assert(pq.length === 4, `pq.length === 4`)
console.assert(pq.removeByPosition(4) === true, `pq.removeByPosition(4) === true`)
console.assert(pq.removeByPosition(4) === false, `pq.removeByPosition(4) === false`)
objEl.c = 'some new property'
console.assert(pq.changePriority(objElRef1, 999) === 1, `pq.changePriority(objElRef3, 999) === 1`)
console.assert(pq.front.c === 'some new property', `pq.front().c === 'some new property'`)

pq.forEach((value, position) => {
    console.log([position, value])
}) // Should write out three items: object, function, string

// Test of thisArg
pq.forEach(function (value, position) {
    console.assert(this.payload === 'test', `this.payload === 'test'`)
    return false;
}, {payload: 'test'})

pq.clear()
console.assert(pq.length === 0, `pq.length === 0`)
console.assert(pq.totalProcessed === 6, `pq.totalProcessed === 6`)
