export interface Circuit { 
    'id': string,
    'nom': string,
    'actif': boolean,
    'entite_type': string,
    'description'?: string,
    // 'entite_cle_nom': string, 
}

export interface CircuitFormData { 
    'nom': string,
    'actif': boolean,
    'entite_type': string,
    'description'?: string,
    // 'entite_cle_nom': string, 
}