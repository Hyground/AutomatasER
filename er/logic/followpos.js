/**
 * Calcula la tabla followpos a partir de un árbol de sintaxis anotado.
 * @param {object} ast El nodo raíz del árbol de sintaxis anotado.
 * @param {number} numPositions El número total de posiciones (hojas) en el árbol.
 * @returns {Array<Set<number>>} La tabla followpos.
 */
export function calcularFollowpos(ast, numPositions) {
    const followposTable = Array(numPositions + 1).fill(null).map(() => new Set());

    const calcular = (node) => {
        if (!node) return;

        if (node.type === 'concat') {
            // Rule for concatenation: for each position i in lastpos(c1),
            // every position in firstpos(c2) is in followpos(i)
            const c1_lastpos = node.left.lastpos;
            const c2_firstpos = node.right.firstpos;
            for (const i of c1_lastpos) {
                for (const j of c2_firstpos) {
                    followposTable[i].add(j);
                }
            }
        } else if (node.type === 'kleene') {
            // Rule for Kleene star: for each position i in lastpos(n),
            // every position in firstpos(n) is in followpos(i)
            const lastpos = node.lastpos;
            const firstpos = node.firstpos;
            for (const i of lastpos) {
                for (const j of firstpos) {
                    followposTable[i].add(j);
                }
            }
        }

        // Traverse the tree
        calcular(node.left);
        calcular(node.right);
        calcular(node.child);
    };

    calcular(ast);
    return followposTable;
}
