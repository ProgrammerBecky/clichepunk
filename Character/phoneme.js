export const phoneme = [
    //Consonant Digraphs
    { letters: ['th'], viseme: 'TH' },
    { letters: ['sh','ss','ti'], viseme: 'SS' },
    { letters: ['tch'], viseme: 'CH' },
    { letters: ['ge'], viseme: 'E' },
    
    //Consonant
    { letters: ['bb','b'], viseme: 'PP' },
    { letters: ['dd', 'd', 'ed'], viseme: 'DD' },
    { letters: ['f','ph'], viseme: 'FF' },
    { letters: ['gg','g'], viseme: 'DD' },
    { letters: ['h'], viseme: 'E' },
    { letters: ['j','ge','dge'], viseme: 'DD' },
    { letters: ['ck','ch','que','c','k'], viseme: 'kk' },
    { letters: ['ll','l'], viseme: 'O' },
    { letters: ['mm','mb','m'], viseme: 'PP' },
    { letters: ['nn','m','kn','gn'], viseme: 'nn' },
    { letters: ['pp','p'], viseme: 'PP' },
    { letters: ['rr','wr','r'], viseme: 'RR' },
    { letters: ['se','ss','ce','sc','s'], viseme: 'SS' },
    { letters: ['tt','t','ed'], viseme: 'kk' },
    { letters: ['ve','v'], viseme: 'FF' },
    { letters: ['w'], viseme: 'CH' },
    { letters: ['y','i'], viseme: 'I' },
    { letters: ['zz','ze','z','x'], viseme: 'E' },


    //Vowels with R
    { letters: ['ar'], viseme: 'R' },
    { letters: ['air','ear','are'], viseme: 'R' },
    { letters: ['irr','ere','eer'], viseme: 'R' },
    { letters: ['or','ore','oor'], viseme: 'R' },
    { letters: ['ur','ir','er','or','ar'], viseme: 'R' },
    
    //Other Vowels
    { letters: ['oo','oul'], viseme: 'O' },
    
    //Vowel Dipthong
    { letters: ['ow','ou'], viseme: 'O' },
    { letters: ['oi','oy'], viseme: 'O' },
    
    //Long Vowels
    { letters: ['a','ay','ai','ey','ei'], viseme: 'aa' },
    { letters: ['ea','ee','ey','ie','y','e'], viseme: 'E' },
    { letters: ['ie','igh','i'], viseme: 'I' },
    { letters: ['oa','ou','ow','o'], viseme: 'O' },
    { letters: ['ew','u'], viseme: 'U' },
    
    //Short Vowels
    { letters: ['au','a'], viseme: 'aa' },
    { letters: ['e','ea'], viseme: 'E' },
    { letters: ['i'], viseme: 'I' },
    { letters: ['au','aw','ough','o'], viseme: 'O' },
    { letters: ['u'], viseme: 'U' },
    
    //Silence
    { letters: ['.',' '], viseme: 'sil' },
];