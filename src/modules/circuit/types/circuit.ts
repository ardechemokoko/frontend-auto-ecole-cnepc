export interface Circuit { 
    'id': string,
    'nom': string,
    'actif': boolean,
    'nom_entite': string,
    'description'?: string,
    // 'entite_cle_nom': string, 
}

export interface CircuitFormData { 
    'nom': string,
    'actif': boolean,
    'nom_entite': string,
    'description'?: string,
    // 'entite_cle_nom': string, 
}